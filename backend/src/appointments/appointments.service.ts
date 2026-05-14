import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { BusinessesService } from '../businesses/businesses.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly businessesService: BusinessesService,
  ) {}

  findAll() {
    return this.appointmentsRepository.find({
      relations: ['customer', 'business'],
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['customer', 'business'],
    });
  }

  async create(createAppointmentDto: CreateAppointmentDto) {
    const business = await this.businessesService.findOne(createAppointmentDto.businessId);

    const appointmentTime = createAppointmentDto.time;
    if (appointmentTime < business.openingTime || appointmentTime > business.closingTime) {
      throw new BadRequestException(
        `La reserva debe estar dentro del horario: ${business.openingTime} - ${business.closingTime}`,
      );
    }

    const appointment = this.appointmentsRepository.create(createAppointmentDto);
    return this.appointmentsRepository.save(appointment);
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentsRepository.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    // Si se actualiza el tiempo o el negocio, deberíamos validar de nuevo
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

    const updatedAppointment = this.appointmentsRepository.merge(
      appointment,
      updateAppointmentDto,
    );

    return this.appointmentsRepository.save(updatedAppointment);
  }

  async remove(id: number) {
    const appointment = await this.appointmentsRepository.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    await this.appointmentsRepository.remove(appointment);

    return { message: `Reserva ${id} eliminada correctamente` };
  }
}