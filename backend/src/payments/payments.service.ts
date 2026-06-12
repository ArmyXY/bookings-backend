import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { User, UserRole } from '../users/user.entity';
import { RewardsService } from '../rewards/rewards.service';

type AuthenticatedUser = Pick<User, 'role' | 'email' | 'businessId'>;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly rewardsService: RewardsService,
  ) { }

  async findAll(user: AuthenticatedUser): Promise<Payment[]> {
    const where =
      user.role === UserRole.BUSINESS
        ? { appointment: { businessId: user.businessId ?? -1 } }
        : user.role === UserRole.CLIENT
          ? { appointment: { customer: { email: user.email } } }
          : {};

    return this.paymentRepository.find({
      where,
      relations: ['appointment', 'appointment.business', 'appointment.customer'],
    });
  }

  async findOne(id: number, user?: AuthenticatedUser): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['appointment', 'appointment.business', 'appointment.customer'],
    });
    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    if (user) {
      this.assertCanAccessPayment(payment, user);
    }

    return payment;
  }

  async create(createPaymentDto: CreatePaymentDto, user: AuthenticatedUser): Promise<Payment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: createPaymentDto.appointmentId },
      relations: ['customer'],
    });
    if (!appointment) {
      throw new NotFoundException(`Reserva con ID ${createPaymentDto.appointmentId} no encontrada`);
    }
    this.assertCanAccessAppointment(appointment, user);

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
    });
    const savedPayment = await this.paymentRepository.save(payment);

    // Si el pago es exitoso, actualizamos el estado de la reserva
    if (savedPayment.status === PaymentStatus.COMPLETED) {
      appointment.status = AppointmentStatus.PAID;
      await this.appointmentRepository.save(appointment);
      
      const pointsToAdd = 10;
      await this.rewardsService.addPoints(appointment.customerId, appointment.businessId, pointsToAdd);
      this.logger.log(`Añadidos ${pointsToAdd} puntos automáticos al cliente ${appointment.customerId} por completar la reserva ${appointment.id}`);
    }

    return savedPayment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto, user: AuthenticatedUser): Promise<Payment> {
    const payment = await this.findOne(id, user);
    const oldStatus = payment.status;

    this.paymentRepository.merge(payment, updatePaymentDto);
    const updatedPayment = await this.paymentRepository.save(payment);

    // Si el estado cambia a COMPLETED, actualizamos la reserva
    if (oldStatus !== PaymentStatus.COMPLETED && updatedPayment.status === PaymentStatus.COMPLETED) {
      const appointment = await this.appointmentRepository.findOneBy({ id: updatedPayment.appointmentId });
      if (appointment) {
        appointment.status = AppointmentStatus.PAID;
        await this.appointmentRepository.save(appointment);
        
        const pointsToAdd = 10;
        await this.rewardsService.addPoints(appointment.customerId, appointment.businessId, pointsToAdd);
        this.logger.log(`Añadidos ${pointsToAdd} puntos automáticos al cliente ${appointment.customerId} por actualización de reserva a completado`);
      }
    }

    return updatedPayment;
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const payment = await this.findOne(id, user);
    await this.paymentRepository.remove(payment);
  }

  private assertCanAccessPayment(payment: Payment, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.BUSINESS && payment.appointment?.businessId === user.businessId) return;

    if (user.role === UserRole.CLIENT && payment.appointment?.customer?.email === user.email) return;

    throw new ForbiddenException('No tienes permisos sobre este pago');
  }

  private assertCanAccessAppointment(appointment: Appointment, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.BUSINESS && appointment.businessId === user.businessId) return;

    if (user.role === UserRole.CLIENT && appointment.customer?.email === user.email) return;

    throw new ForbiddenException('No tienes permisos sobre la reserva asociada');
  }
}
