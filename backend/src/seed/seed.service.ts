import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../businesses/business.entity';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../payments/payment.entity';
import { User, UserRole } from '../users/user.entity';
import { hashPassword } from '../auth/password.utils';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async seed() {
    try {
      // 1. Limpiar base de datos usando query nativo para evitar problemas de truncado con FKs
      await this.paymentRepo.query('DELETE FROM payment');
      await this.appointmentRepo.query('DELETE FROM appointment');
      await this.businessRepo.query('DELETE FROM businesses');
      await this.userRepo.query('DELETE FROM users');

      // Resetear secuencias de ID en SQLite
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='payment'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='appointment'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='businesses'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='users'");

      // 2. Crear 30 Negocios
      const businessCategories = [
        { name: 'Peluquería', services: ['Corte de pelo', 'Tinte', 'Lavado y Peinado', 'Barba'] },
        { name: 'Dentista', services: ['Limpieza dental', 'Ortodoncia', 'Revisión general', 'Blanqueamiento'] },
        { name: 'Gimnasio', services: ['Clase Crossfit', 'Entrenamiento personal', 'Evaluación física', 'Yoga'] },
        { name: 'Fisioterapia', services: ['Masaje terapéutico', 'Rehabilitación', 'Punción seca', 'Sesión de espalda'] },
        { name: 'Veterinaria', services: ['Vacunación', 'Consulta general', 'Desparasitación', 'Urgencias'] },
        { name: 'Restaurante', services: ['Reserva de mesa', 'Cena degustación', 'Almuerzo corporativo'] },
        { name: 'Estética', services: ['Manicura', 'Pedicura', 'Tratamiento facial', 'Depilación'] },
        { name: 'Taller Mecánico', services: ['Cambio de aceite', 'Revisión ITV', 'Alineación ruedas'] },
        { name: 'Academia', services: ['Clase de inglés', 'Clase de apoyo', 'Preparación examen'] },
      ];

      const businessDataList: Partial<Business>[] = [];
      for (let i = 1; i <= 30; i++) {
        const cat = businessCategories[(i - 1) % businessCategories.length];
        businessDataList.push({
          name: `${cat.name} ${i}`,
          address: `Calle Comercio ${i}, Ciudad`,
          phone: `900${String(i).padStart(3, '0')}000`,
          email: `contacto${i}@negocio${i}.com`,
          description: `Servicios profesionales de ${cat.name.toLowerCase()} de alta calidad.`,
          openingTime: '09:00',
          closingTime: '20:00',
        });
      }
      const businesses = await this.businessRepo.save(businessDataList);

      // 3. Preparar 200 clientes como usuarios
      const clientDataList: Partial<User>[] = [];
      const firstNames = ['Álvaro', 'María', 'Carlos', 'Lucía', 'Elena', 'Juan', 'Ana', 'Pedro', 'Sofía', 'Luis', 'Laura', 'David', 'Carmen', 'Javier', 'Paula', 'Diego', 'Marta', 'Alejandro', 'Sara', 'Manuel'];
      const lastNames = ['García', 'López', 'Ruiz', 'Fernández', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Torres', 'Domínguez'];
      
      for (let i = 1; i <= 200; i++) {
        const fn = firstNames[(i - 1) % firstNames.length];
        const ln = lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length];
        clientDataList.push({
          name: `${fn} ${ln} ${i}`,
          email: `cliente${i}@mail.com`,
          passwordHash: await hashPassword('cliente123'),
          isClient: true,
          role: UserRole.CLIENT,
          businessId: null,
        });
      }

      // 4. Crear 231 Usuarios (1 admin, 30 managers, 200 clientes)
      const userDataList: Partial<User>[] = [];

      // 1 Administrador
      userDataList.push({
        name: 'Administrador Demo',
        email: 'admin@demo.com',
        passwordHash: await hashPassword('admin123'),
        isClient: false,
        role: UserRole.ADMIN,
        businessId: null,
      });

      // 30 Business Managers
      for (let i = 1; i <= 30; i++) {
        userDataList.push({
          name: `Business Manager ${i}`,
          email: `manager${i}@demo.com`,
          passwordHash: await hashPassword('manager123'),
          isClient: false,
          role: UserRole.BUSINESS,
          businessId: businesses[i - 1].id,
        });
      }

      userDataList.push(...clientDataList);

      const users = await this.userRepo.save(userDataList);
      const clientUsers = users.filter((user) => user.role === UserRole.CLIENT);

      // 5. Crear 300 Reservas
      const appointmentDataList: Partial<Appointment>[] = [];
      const statuses = [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.PAID,
        AppointmentStatus.PENDING,
        AppointmentStatus.CANCELLED,
      ];

      for (let i = 1; i <= 300; i++) {
        // Enlazar de forma balanceada o aleatoria
        const customer = clientUsers[(i - 1) % clientUsers.length];
        const businessIndex = (i - 1) % businesses.length;
        const business = businesses[businessIndex];
        const cat = businessCategories[businessIndex % businessCategories.length];
        const service = cat.services[(i - 1) % cat.services.length];

        // Fechas entre junio y julio de 2026
        const day = String(1 + ((i - 1) % 28)).padStart(2, '0');
        const month = i % 2 === 0 ? '06' : '07';
        const dateStr = `2026-${month}-${day}`;

        // Horas entre 09:00 y 19:30
        const hour = String(9 + ((i - 1) % 11)).padStart(2, '0');
        const minute = i % 2 === 0 ? '00' : '30';
        const timeStr = `${hour}:${minute}`;

        appointmentDataList.push({
          date: dateStr,
          time: timeStr,
          status: statuses[(i - 1) % statuses.length],
          serviceName: service,
          businessId: business.id,
          customerId: customer.id,
        });
      }
      const appointments = await this.appointmentRepo.save(appointmentDataList);

      // 6. Crear 300 Pagos vinculados a cada reserva
      const paymentDataList: Partial<Payment>[] = [];
      const paymentMethods = [PaymentMethod.CARD, PaymentMethod.CASH, PaymentMethod.TRANSFER];

      for (let i = 1; i <= 300; i++) {
        const appointment = appointments[i - 1];
        
        // Coherencia de estado de pago según estado de reserva
        let paymentStatus: PaymentStatus;
        if (appointment.status === AppointmentStatus.PAID) {
          paymentStatus = PaymentStatus.COMPLETED;
        } else if (appointment.status === AppointmentStatus.CANCELLED) {
          paymentStatus = i % 2 === 0 ? PaymentStatus.REFUNDED : PaymentStatus.PENDING;
        } else {
          paymentStatus = PaymentStatus.PENDING;
        }

        // Monto aleatorio realista entre 15.00 y 150.00
        const amount = parseFloat((15 + ((i * 17) % 136)).toFixed(2));

        paymentDataList.push({
          amount: amount,
          status: paymentStatus,
          method: paymentMethods[(i - 1) % paymentMethods.length],
          appointmentId: appointment.id,
        });
      }
      await this.paymentRepo.save(paymentDataList);

      return { message: 'Database successfully seeded with 30 businesses, 200 client users, 300 appointments, and 300 payments.' };
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
}
