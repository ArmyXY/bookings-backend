import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { User, UserRole } from '../users/user.entity';

type AuthenticatedUser = Pick<User, 'role' | 'businessId'>;

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  findAll(businessId?: number): Promise<Service[]> {
    const where = businessId ? { businessId } : {};
    return this.serviceRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }
    return service;
  }

  async create(createServiceDto: CreateServiceDto, user: AuthenticatedUser): Promise<Service> {
    if (
      user.role === UserRole.BUSINESS &&
      user.businessId !== createServiceDto.businessId
    ) {
      throw new ForbiddenException('No puedes crear servicios para otro negocio');
    }

    const service = this.serviceRepository.create(createServiceDto);
    return this.serviceRepository.save(service);
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
    user: AuthenticatedUser,
  ): Promise<Service> {
    const service = await this.findOne(id);

    if (user.role === UserRole.BUSINESS && user.businessId !== service.businessId) {
      throw new ForbiddenException('No puedes modificar servicios de otro negocio');
    }

    Object.assign(service, updateServiceDto);
    return this.serviceRepository.save(service);
  }

  async remove(id: number, user: AuthenticatedUser): Promise<{ message: string }> {
    const service = await this.findOne(id);

    if (user.role === UserRole.BUSINESS && user.businessId !== service.businessId) {
      throw new ForbiddenException('No puedes eliminar servicios de otro negocio');
    }

    await this.serviceRepository.remove(service);
    return { message: `Servicio ${id} eliminado correctamente` };
  }
}
