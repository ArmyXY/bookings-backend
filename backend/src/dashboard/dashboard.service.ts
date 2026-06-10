import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { User, UserRole } from '../users/user.entity';
import { RewardsService } from '../rewards/rewards.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly rewardsService: RewardsService,
  ) {}

  async getStats() {
    // 1. Ingresos totales (Pagos completados)
    const payments = await this.paymentRepository.find({
      where: { status: PaymentStatus.COMPLETED },
    });
    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    // 2. Totales de entidades
    const totalAppointments = await this.appointmentRepository.count();
    const totalCustomers = await this.userRepository.count({ where: { role: UserRole.CLIENT } });

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

  async getBusinessStats(businessId: number) {
    const appointments = await this.appointmentRepository.find({ where: { businessId } });
    const payments = await this.paymentRepository.find({
      where: { appointment: { businessId }, status: PaymentStatus.COMPLETED },
    });

    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalAppointments = appointments.length;

    // Get unique customers count
    const uniqueCustomers = new Set(appointments.map((a) => a.customerId));

    const appointmentsByStatus = {
      pending: appointments.filter((a) => a.status === AppointmentStatus.PENDING).length,
      confirmed: appointments.filter((a) => a.status === AppointmentStatus.CONFIRMED).length,
      paid: appointments.filter((a) => a.status === AppointmentStatus.PAID).length,
      cancelled: appointments.filter((a) => a.status === AppointmentStatus.CANCELLED).length,
    };

    return {
      stats: {
        totalRevenue,
        totalAppointments,
        totalCustomers: uniqueCustomers.size,
      },
      appointmentsByStatus,
    };
  }

  async getClientStats(customerId: number) {
    const appointments = await this.appointmentRepository.find({ where: { customerId } });
    const payments = await this.paymentRepository.find({
      where: { appointment: { customerId }, status: PaymentStatus.COMPLETED },
    });

    const totalSpent = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalAppointments = appointments.length;

    const pointsList = await this.rewardsService.getCustomerPoints(customerId);
    const totalPoints = pointsList.reduce((acc, p) => acc + p.points, 0);

    return {
      stats: {
        totalSpent,
        totalAppointments,
        totalPoints,
      },
      pointsByBusiness: pointsList.map((p) => ({
        businessId: p.businessId,
        businessName: p.business?.name,
        points: p.points,
      })),
      recentAppointments: appointments.slice(-5).map(a => ({
        id: a.id,
        service: a.serviceName,
        date: a.date,
        status: a.status,
      })),
    };
  }
}
