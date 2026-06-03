import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { BusinessesService } from '../businesses/businesses.service';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { User, UserRole } from '../users/user.entity';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

type AuthenticatedUser = Pick<User, 'role' | 'email' | 'businessId'>;

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly businessesService: BusinessesService,
  ) {}

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
    const appointment = this.appointmentsRepository.create(appointmentDto);
    const savedAppointment = await this.appointmentsRepository.save(appointment);

    if (paymentMethod) {
      const payment = this.paymentsRepository.create({
        amount: 0,
        status: PaymentStatus.PENDING,
        method: paymentMethod,
        appointmentId: savedAppointment.id,
      });
      await this.paymentsRepository.save(payment);
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

      if (status !== AppointmentStatus.CANCELLED) {
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
    const updatedAppointment = this.appointmentsRepository.merge(appointment, appointmentDto);
    const savedAppointment = await this.appointmentsRepository.save(updatedAppointment);

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
