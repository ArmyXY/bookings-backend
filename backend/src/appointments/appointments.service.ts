import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { BusinessesService } from '../businesses/businesses.service';
import { RewardsService } from '../rewards/rewards.service';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { User, UserRole } from '../users/user.entity';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Service } from '../services/service.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

type AuthenticatedUser = Pick<User, 'role' | 'email' | 'businessId'>;

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    private readonly businessesService: BusinessesService,
    private readonly rewardsService: RewardsService,
  ) { }

  findAll(user: AuthenticatedUser) {
    const where =
      user.role === UserRole.BUSINESS
        ? { businessId: user.businessId ?? -1 }
        : user.role === UserRole.CLIENT
          ? { customer: { email: user.email } }
          : {};

    return this.appointmentsRepository.find({
      where,
      relations: ['customer', 'business', 'payments'],
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  findAvailability() {
    return this.appointmentsRepository
      .createQueryBuilder('appointment')
      .select(['appointment.businessId', 'appointment.date', 'appointment.time'])
      .where('appointment.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .getRawMany()
      .then((rows) =>
        rows.map((row) => ({
          businessId: row.appointment_businessId,
          date: row.appointment_date,
          time: row.appointment_time,
        })),
      );
  }

  async findUnpaid(user: AuthenticatedUser) {
    if (user.role !== UserRole.BUSINESS) {
      throw new ForbiddenException('Solo las empresas pueden ver esta lista');
    }

    // Buscamos reservas de esta empresa con estado diferente a pagado o cancelado, 
    // o con pagos pendientes.
    return this.appointmentsRepository.find({
      where: [
        { businessId: user.businessId ?? -1, status: AppointmentStatus.PENDING },
        { businessId: user.businessId ?? -1, status: AppointmentStatus.CONFIRMED },
      ],
      relations: ['customer', 'payments'],
      order: { date: 'DESC', time: 'DESC' },
    });
  }


  async findOne(id: number, user?: AuthenticatedUser) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['customer', 'business', 'payments'],
    });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    if (user) {
      this.assertCanAccessAppointment(appointment, user);
    }

    return appointment;
  }

  async create(createAppointmentDto: CreateAppointmentDto, user: AuthenticatedUser) {
    await this.assertCanCreateAppointment(createAppointmentDto, user);
    const business = await this.businessesService.findOne(createAppointmentDto.businessId);

    const appointmentTime = createAppointmentDto.time;
    if (appointmentTime < business.openingTime || appointmentTime > business.closingTime) {
      throw new BadRequestException(
        `La reserva debe estar dentro del horario: ${business.openingTime} - ${business.closingTime}`,
      );
    }

    // Buscamos el servicio para asignar el precio correcto
    const service = await this.servicesRepository.findOne({
      where: {
        name: createAppointmentDto.serviceName,
        businessId: createAppointmentDto.businessId,
      },
    });

    if (!service) {
      this.logger.error(`Intento de reserva de un servicio inexistente: ${createAppointmentDto.serviceName}`);
      throw new BadRequestException(`El servicio '${createAppointmentDto.serviceName}' no existe.`);
    }

    if (service.price <= 0) {
      this.logger.warn(`Creando reserva para un servicio con precio 0 o negativo: ${service.name}`);
    }

    // Check for double booking
    const existing = await this.appointmentsRepository.findOne({
      where: {
        businessId: createAppointmentDto.businessId,
        date: createAppointmentDto.date,
        time: createAppointmentDto.time,
        status: Not(AppointmentStatus.CANCELLED),
      },
    });

    if (existing) {
      throw new BadRequestException('Esta hora ya está reservada para este negocio');
    }

    const { paymentMethod, ...appointmentDto } = createAppointmentDto;
    const appointment = this.appointmentsRepository.create({
      ...appointmentDto,
      price: service.price,
    });
    const savedAppointment = await this.appointmentsRepository.save(appointment);

    if (paymentMethod) {
      const payment = this.paymentsRepository.create({
        amount: service.price,
        status: PaymentStatus.PENDING,
        method: paymentMethod,
        appointmentId: savedAppointment.id,
      });
      await this.paymentsRepository.save(payment);
      this.logger.log(`Creado pago pendiente por ${service.price}€ para la reserva ${savedAppointment.id}`);
    }

    return this.findOne(savedAppointment.id, user);
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto, user: AuthenticatedUser) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    this.assertCanAccessAppointment(appointment, user);
    await this.assertCanCreateAppointment(
      {
        businessId: updateAppointmentDto.businessId ?? appointment.businessId,
        customerId: updateAppointmentDto.customerId ?? appointment.customerId,
      },
      user,
    );

    if (
      updateAppointmentDto.time ||
      updateAppointmentDto.businessId ||
      updateAppointmentDto.date ||
      updateAppointmentDto.status
    ) {
      const businessId = updateAppointmentDto.businessId ?? appointment.businessId;
      const date = updateAppointmentDto.date ?? appointment.date;
      const time = updateAppointmentDto.time ?? appointment.time;
      const status = updateAppointmentDto.status ?? appointment.status;

      const business = await this.businessesService.findOne(businessId);

      if (time < business.openingTime || time > business.closingTime) {
        throw new BadRequestException(
          `La reserva debe estar dentro del horario: ${business.openingTime} - ${business.closingTime}`,
        );
      }

      const newStatus = updateAppointmentDto.status ?? appointment.status;
      if (newStatus !== AppointmentStatus.CANCELLED) {
        const existing = await this.appointmentsRepository.findOne({
          where: {
            businessId,
            date,
            time,
            id: Not(id),
            status: Not(AppointmentStatus.CANCELLED),
          },
        });
        if (existing) {
          throw new BadRequestException('Esta hora ya está reservada para este negocio');
        }
      }
    }

    const { paymentMethod: _paymentMethod, ...appointmentDto } = updateAppointmentDto;
    
    const oldStatus = appointment.status;
    const updatedAppointment = this.appointmentsRepository.merge(appointment, appointmentDto);
    const savedAppointment = await this.appointmentsRepository.save(updatedAppointment);
    const newStatus = savedAppointment.status;

    // Otorgar 10 puntos si pasa de pendiente/cancelado a confirmado/completado
    if (
      (oldStatus === AppointmentStatus.PENDING || oldStatus === AppointmentStatus.CANCELLED) &&
      (newStatus === AppointmentStatus.CONFIRMED || newStatus === AppointmentStatus.PAID)
    ) {
      await this.rewardsService.addPoints(savedAppointment.customerId, savedAppointment.businessId, 10);
      this.logger.log(`Añadidos 10 puntos al cliente ${savedAppointment.customerId} por cambio de estado a ${newStatus}`);
    }

    return this.findOne(savedAppointment.id, user);
  }

  async remove(id: number, user: AuthenticatedUser) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    this.assertCanAccessAppointment(appointment, user);
    await this.appointmentsRepository.remove(appointment);

    return { message: `Reserva ${id} eliminada correctamente` };
  }

  private assertCanAccessAppointment(appointment: Appointment, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.BUSINESS && appointment.businessId === user.businessId) return;
    if (user.role === UserRole.CLIENT && appointment.customer?.email === user.email) return;
    throw new ForbiddenException('No tienes permisos sobre esta reserva');
  }

  private async assertCanCreateAppointment(
    appointment: Pick<CreateAppointmentDto, 'businessId' | 'customerId'>,
    user: AuthenticatedUser,
  ) {
    const customer = await this.usersRepository.findOne({
      where: { id: appointment.customerId },
    });

    if (!customer || customer.role !== UserRole.CLIENT) {
      throw new NotFoundException(`Cliente con ID ${appointment.customerId} no encontrado`);
    }

    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.BUSINESS) {
      if (appointment.businessId === user.businessId) return;
      throw new ForbiddenException('No puedes gestionar reservas de otro negocio');
    }

    if (customer.email === user.email) return;
    throw new ForbiddenException('No puedes gestionar reservas de otro cliente');
  }
}
