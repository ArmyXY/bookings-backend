import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './customer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'El cliente ha sido creado exitosamente.', type: Customer })
  create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    return this.customersService.create(createCustomerDto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obtener todos los clientes' })
  @ApiResponse({ status: 200, description: 'Retorna todos los clientes existentes.', type: [Customer] })
  findAll(@Request() req) {
    return this.customersService.findAll(req.user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obtener un cliente por id' })
  @ApiResponse({ status: 200, description: 'Retorna el cliente solicitado.', type: Customer })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.customersService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiResponse({ status: 200, description: 'El cliente ha sido actualizado exitosamente.', type: Customer })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCustomerDto: UpdateCustomerDto, @Request() req) {
    return this.customersService.update(id, updateCustomerDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiResponse({ status: 200, description: 'El cliente ha sido eliminado exitosamente.' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.customersService.remove(id, req.user);
  }
}
