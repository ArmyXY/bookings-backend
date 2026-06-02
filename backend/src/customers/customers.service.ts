import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';

type AuthenticatedUser = Pick<User, 'role' | 'email' | 'businessId'>;

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly usersService: UsersService,
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

    // Check if the user already exists by email
    const existingUser = await this.usersService.findByEmail(createCustomerDto.email);
    if (!existingUser) {
      // Create user so the client can log in
      await this.usersService.create({
        name: createCustomerDto.name,
        email: createCustomerDto.email,
        password: createCustomerDto.password || 'cliente123',
        role: UserRole.CLIENT,
      });
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto, user: AuthenticatedUser): Promise<Customer> {
    const customer = await this.findOne(id, user);
    const oldEmail = customer.email;

    if (user.role === UserRole.CLIENT && updateCustomerDto.email && updateCustomerDto.email !== user.email) {
      throw new ForbiddenException('No puedes cambiar el email de otro cliente');
    }

    this.customerRepository.merge(customer, updateCustomerDto);
    const savedCustomer = await this.customerRepository.save(customer);

    // Sync to User table!
    const dbUser = await this.usersService.findByEmail(oldEmail);
    if (dbUser && dbUser.role === UserRole.CLIENT) {
      const updateData: any = {};
      if (updateCustomerDto.name) updateData.name = updateCustomerDto.name;
      if (updateCustomerDto.email) updateData.email = updateCustomerDto.email;
      if (updateCustomerDto.password) updateData.password = updateCustomerDto.password;
      await this.usersService.update(dbUser.id, updateData);
    }

    return savedCustomer;
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const customer = await this.findOne(id, user);
    const email = customer.email;
    await this.customerRepository.remove(customer);

    // Sync to User table!
    const dbUser = await this.usersService.findByEmail(email);
    if (dbUser && dbUser.role === UserRole.CLIENT) {
      await this.usersService.remove(dbUser.id);
    }
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
