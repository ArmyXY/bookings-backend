import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { Customer } from '../customers/customer.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getStats() {
    // 1. Ingresos totales (Pagos completados)
    const payments = await this.paymentRepository.find({
      where: { status: PaymentStatus.COMPLETED },
    });
    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    // 2. Totales de entidades
    const totalAppointments = await this.appointmentRepository.count();
    const totalCustomers = await this.customerRepository.count();

    // 3. Desglose por estado de reservas
    const appointments = await this.appointmentRepository.find();
    const appointmentsByStatus = {
      pending: appointments.filter(a => a.status === AppointmentStatus.PENDING).length,
      confirmed: appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
      paid: appointments.filter(a => a.status === AppointmentStatus.PAID).length,
    };

    // 4. Actividad reciente (últimos 5 pagos y 5 reservas)
    const recentAppointments = await this.appointmentRepository.find({
      relations: ['customer'],
      order: { id: 'DESC' },
      take: 5,
    });

    const recentPayments = await this.paymentRepository.find({
      relations: ['appointment'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      stats: {
        totalRevenue,
        totalAppointments,
        totalCustomers,
      },
      appointmentsByStatus,
      recentActivity: {
        appointments: recentAppointments.map(a => ({
          id: a.id,
          customer: a.customer?.name || 'Cliente desconocido',
          service: a.serviceName,
          date: a.date,
          status: a.status,
        })),
        payments: recentPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          date: p.createdAt,
        })),
      },
    };
  }
}
