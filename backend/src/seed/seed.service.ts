import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../businesses/business.entity';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../payments/payment.entity';
import { User, UserRole } from '../users/user.entity';
import { Service } from '../services/service.entity';
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
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) { }

  async seed() {
    try {
      // 1. Limpiar base de datos usando query nativo para evitar problemas de truncado con FKs
      await this.paymentRepo.query('DELETE FROM payment');
      await this.appointmentRepo.query('DELETE FROM appointment');
      await this.serviceRepo.query('DELETE FROM services');
      await this.businessRepo.query('DELETE FROM businesses');
      await this.userRepo.query('DELETE FROM users');

      // Resetear secuencias de ID en SQLite
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='payment'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='appointment'");
      await this.serviceRepo.query("DELETE FROM sqlite_sequence WHERE name='services'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='businesses'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='users'");

      // 2. Definir categorías de negocio con sus servicios y precios realistas
      const businessCategories = [
        {
          name: 'Peluquería',
          services: [
            { name: 'Corte de pelo', description: 'Corte clásico con lavado incluido', price: 18, duration: 45 },
            { name: 'Tinte', description: 'Tinte completo con decoloración', price: 55, duration: 120 },
            { name: 'Lavado y Peinado', description: 'Lavado, acondicionado y peinado profesional', price: 22, duration: 30 },
            { name: 'Barba', description: 'Arreglo y perfilado de barba', price: 12, duration: 20 },
          ],
        },
        {
          name: 'Dentista',
          services: [
            { name: 'Limpieza dental', description: 'Limpieza profesional con ultrasonidos', price: 60, duration: 60 },
            { name: 'Ortodoncia (revisión)', description: 'Revisión de ortodoncia mensual', price: 40, duration: 30 },
            { name: 'Revisión general', description: 'Revisión completa con radiografías', price: 35, duration: 45 },
            { name: 'Blanqueamiento', description: 'Blanqueamiento dental profesional', price: 150, duration: 90 },
          ],
        },
        {
          name: 'Gimnasio',
          services: [
            { name: 'Clase Crossfit', description: 'Sesión de entrenamiento funcional de alta intensidad', price: 15, duration: 60 },
            { name: 'Entrenamiento personal', description: 'Sesión personalizada con entrenador certificado', price: 45, duration: 60 },
            { name: 'Evaluación física', description: 'Evaluación completa de condición física y plan de entrenamiento', price: 30, duration: 90 },
            { name: 'Yoga', description: 'Clase de yoga para todos los niveles', price: 12, duration: 60 },
          ],
        },
        {
          name: 'Fisioterapia',
          services: [
            { name: 'Masaje terapéutico', description: 'Masaje descontracturante de espalda y cuello', price: 50, duration: 60 },
            { name: 'Rehabilitación', description: 'Sesión de rehabilitación postoperatoria', price: 55, duration: 45 },
            { name: 'Punción seca', description: 'Técnica de punción seca para puntos gatillo', price: 40, duration: 30 },
            { name: 'Sesión de espalda', description: 'Tratamiento específico para dolores de espalda', price: 45, duration: 45 },
          ],
        },
        {
          name: 'Veterinaria',
          services: [
            { name: 'Vacunación', description: 'Vacuna anual con revisión incluida', price: 35, duration: 20 },
            { name: 'Consulta general', description: 'Consulta veterinaria completa', price: 40, duration: 30 },
            { name: 'Desparasitación', description: 'Tratamiento antiparasitario interno y externo', price: 25, duration: 15 },
            { name: 'Urgencias', description: 'Atención veterinaria urgente', price: 70, duration: 60 },
          ],
        },
        {
          name: 'Restaurante',
          services: [
            { name: 'Reserva de mesa', description: 'Reserva para cena estándar', price: 0, duration: 90 },
            { name: 'Cena degustación', description: 'Menú degustación de 7 platos con maridaje', price: 95, duration: 150 },
            { name: 'Almuerzo corporativo', description: 'Menú especial para grupos de empresa', price: 35, duration: 90 },
          ],
        },
        {
          name: 'Estética',
          services: [
            { name: 'Manicura', description: 'Manicura completa con esmalte semipermanente', price: 28, duration: 60 },
            { name: 'Pedicura', description: 'Pedicura completa con tratamiento hidratante', price: 32, duration: 60 },
            { name: 'Tratamiento facial', description: 'Limpieza facial profunda e hidratación', price: 55, duration: 75 },
            { name: 'Depilación', description: 'Depilación con cera de piernas completas', price: 38, duration: 45 },
          ],
        },
        {
          name: 'Taller Mecánico',
          services: [
            { name: 'Cambio de aceite', description: 'Cambio de aceite y filtro, revisión de niveles', price: 65, duration: 60 },
            { name: 'Revisión ITV', description: 'Preparación del vehículo para la ITV', price: 45, duration: 90 },
            { name: 'Alineación de ruedas', description: 'Equilibrado y alineación de las 4 ruedas', price: 40, duration: 60 },
          ],
        },
        {
          name: 'Academia',
          services: [
            { name: 'Clase de inglés', description: 'Clase individual de inglés con profesor nativo', price: 25, duration: 60 },
            { name: 'Clase de apoyo', description: 'Apoyo escolar para primaria y secundaria', price: 20, duration: 60 },
            { name: 'Preparación examen', description: 'Preparación intensiva para exámenes oficiales', price: 30, duration: 90 },
          ],
        },
      ];

      // 3. Crear 30 Negocios
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

      // 4. Crear servicios para cada negocio
      const serviceDataList: Partial<Service>[] = [];
      for (let i = 0; i < businesses.length; i++) {
        const business = businesses[i];
        const cat = businessCategories[i % businessCategories.length];
        for (const svc of cat.services) {
          serviceDataList.push({
            name: svc.name,
            description: svc.description,
            price: svc.price,
            duration: svc.duration,
            isActive: true,
            businessId: business.id,
          });
        }
      }
      const services = await this.serviceRepo.save(serviceDataList);

      // 5. Preparar 200 clientes como usuarios
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

      // 6. Crear 231 Usuarios (1 admin, 30 managers, 200 clientes)
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

      // 7. Crear 300 Reservas
      const appointmentDataList: Partial<Appointment>[] = [];
      const statuses = [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.PAID,
        AppointmentStatus.PENDING,
        AppointmentStatus.CANCELLED,
      ];

      for (let i = 1; i <= 300; i++) {
        const customer = clientUsers[(i - 1) % clientUsers.length];
        const businessIndex = (i - 1) % businesses.length;
        const business = businesses[businessIndex];
        const cat = businessCategories[businessIndex % businessCategories.length];
        const svc = cat.services[(i - 1) % cat.services.length];

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
          serviceName: svc.name,
          businessId: business.id,
          customerId: customer.id,
        });
      }
      const appointments = await this.appointmentRepo.save(appointmentDataList);

      // 8. Crear 300 Pagos vinculados a cada reserva
      const paymentDataList: Partial<Payment>[] = [];
      const paymentMethods = [PaymentMethod.CARD, PaymentMethod.CASH, PaymentMethod.TRANSFER];

      for (let i = 1; i <= 300; i++) {
        const appointment = appointments[i - 1];
        const businessIndex = (i - 1) % businesses.length;
        const cat = businessCategories[businessIndex % businessCategories.length];
        const svc = cat.services[(i - 1) % cat.services.length];

        let paymentStatus: PaymentStatus;
        if (appointment.status === AppointmentStatus.PAID) {
          paymentStatus = PaymentStatus.COMPLETED;
        } else if (appointment.status === AppointmentStatus.CANCELLED) {
          paymentStatus = i % 2 === 0 ? PaymentStatus.REFUNDED : PaymentStatus.PENDING;
        } else {
          paymentStatus = PaymentStatus.PENDING;
        }

        paymentDataList.push({
          amount: svc.price,
          status: paymentStatus,
          method: paymentMethods[(i - 1) % paymentMethods.length],
          appointmentId: appointment.id,
        });
      }
      await this.paymentRepo.save(paymentDataList);

      return {
        message: `Database successfully seeded with 30 businesses, ${services.length} services, 200 client users, 300 appointments, and 300 payments.`,
      };
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
}
