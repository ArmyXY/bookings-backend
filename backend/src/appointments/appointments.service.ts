import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessesService } from '../businesses/businesses.service';
import { Customer } from '../customers/customer.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { User, UserRole } from '../users/user.entity';
import { Appointment } from './appointment.entity';
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
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
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

    const { paymentMethod, ...appointmentDto } = createAppointmentDto;
    const appointment = this.appointmentsRepository.create(appointmentDto);
    const savedAppointment = await this.appointmentsRepository.save(appointment);

    if (paymentMethod) {
      const payment = this.paymentsRepository.create({
        amount: 0,
        status: PaymentStatus.PENDING,
        method: paymentMethod,
        appointmentId: savedAppointment.id,
        businessId: savedAppointment.businessId,
        customerId: savedAppointment.customerId,
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

    if (updateAppointmentDto.time || updateAppointmentDto.businessId) {
      const businessId = updateAppointmentDto.businessId || appointment.businessId;
      const time = updateAppointmentDto.time || appointment.time;
      const business = await this.businessesService.findOne(businessId);

      if (time < business.openingTime || time > business.closingTime) {
        throw new BadRequestException(
          `La reserva debe estar dentro del horario: ${business.openingTime} - ${business.closingTime}`,
        );
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
    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.BUSINESS) {
      if (appointment.businessId === user.businessId) return;
      throw new ForbiddenException('No puedes gestionar reservas de otro negocio');
    }

    const customer = await this.customersRepository.findOne({
      where: { id: appointment.customerId },
    });

    if (customer?.email === user.email) return;
    throw new ForbiddenException('No puedes gestionar reservas de otro cliente');
  }
}
