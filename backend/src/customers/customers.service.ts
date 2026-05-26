import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { User, UserRole } from '../users/user.entity';

type AuthenticatedUser = Pick<User, 'role' | 'email' | 'businessId'>;

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(user: AuthenticatedUser): Promise<Customer[]> {
    const where =
      user.role === UserRole.BUSINESS
        ? { appointments: { businessId: user.businessId ?? -1 } }
        : user.role === UserRole.CLIENT
          ? { email: user.email }
          : {};

    return this.customerRepository.find({
      where,
      relations: ['appointments', 'payments'],
    });
  }

  async findOne(id: number, user?: AuthenticatedUser): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['appointments', 'payments'],
    });
    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    if (user) {
      this.assertCanAccessCustomer(customer, user);
    }

    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto, user: AuthenticatedUser): Promise<Customer> {
    if (user.role === UserRole.CLIENT && createCustomerDto.email !== user.email) {
      throw new ForbiddenException('No puedes crear un perfil para otro cliente');
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto, user: AuthenticatedUser): Promise<Customer> {
    const customer = await this.findOne(id, user);

    if (user.role === UserRole.CLIENT && updateCustomerDto.email && updateCustomerDto.email !== user.email) {
      throw new ForbiddenException('No puedes cambiar el email de otro cliente');
    }

    this.customerRepository.merge(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const customer = await this.findOne(id, user);
    await this.customerRepository.remove(customer);
  }

  private assertCanAccessCustomer(customer: Customer, user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.CLIENT && customer.email === user.email) return;

    if (
      user.role === UserRole.BUSINESS &&
      customer.appointments?.some((appointment) => appointment.businessId === user.businessId)
    ) {
      return;
    }

    throw new ForbiddenException('No tienes permisos sobre este cliente');
  }
}
