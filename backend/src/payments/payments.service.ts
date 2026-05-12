import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({ relations: ['appointment'] });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['appointment'],
    });
    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }
    return payment;
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const appointment = await this.appointmentRepository.findOneBy({ id: createPaymentDto.appointmentId });
    if (!appointment) {
      throw new NotFoundException(`Reserva con ID ${createPaymentDto.appointmentId} no encontrada`);
    }

    const payment = this.paymentRepository.create(createPaymentDto);
    const savedPayment = await this.paymentRepository.save(payment);

    // Si el pago es exitoso, actualizamos el estado de la reserva
    if (savedPayment.status === PaymentStatus.COMPLETED) {
      appointment.status = AppointmentStatus.PAID;
      await this.appointmentRepository.save(appointment);
    }

    return savedPayment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    const oldStatus = payment.status;
    
    this.paymentRepository.merge(payment, updatePaymentDto);
    const updatedPayment = await this.paymentRepository.save(payment);

    // Si el estado cambia a COMPLETED, actualizamos la reserva
    if (oldStatus !== PaymentStatus.COMPLETED && updatedPayment.status === PaymentStatus.COMPLETED) {
      const appointment = await this.appointmentRepository.findOneBy({ id: updatedPayment.appointmentId });
      if (appointment) {
        appointment.status = AppointmentStatus.PAID;
        await this.appointmentRepository.save(appointment);
      }
    }

    return updatedPayment;
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }
}
