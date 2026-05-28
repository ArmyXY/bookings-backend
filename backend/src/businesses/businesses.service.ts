import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { User, UserRole } from '../users/user.entity';

type AuthenticatedUser = Pick<User, 'role' | 'businessId'>;

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async findAll(): Promise<Business[]> {
    return this.businessRepository.find();
  }

  async findOne(id: number): Promise<Business> {
    const business = await this.businessRepository.findOne({ where: { id } });
    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }
    return business;
  }

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto, user?: AuthenticatedUser): Promise<Business> {
    if (user?.role === UserRole.BUSINESS && user.businessId !== id) {
      throw new ForbiddenException('No puedes modificar otro negocio');
    }

    const business = await this.findOne(id);
    Object.assign(business, updateBusinessDto);
    return this.businessRepository.save(business);
  }

  async remove(id: number): Promise<void> {
    const result = await this.businessRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }
  }
}
