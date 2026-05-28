import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './payment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Registrar un nuevo pago' })
  @ApiResponse({ status: 201, description: 'El pago ha sido registrado exitosamente.', type: Payment })
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.create(createPaymentDto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obtener todos los pagos' })
  @ApiResponse({ status: 200, description: 'Retorna todos los pagos registrados.', type: [Payment] })
  findAll(@Request() req) {
    return this.paymentsService.findAll(req.user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obtener un pago por id' })
  @ApiResponse({ status: 200, description: 'Retorna el pago solicitado.', type: Payment })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.paymentsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Actualizar un pago' })
  @ApiResponse({ status: 200, description: 'El pago ha sido actualizado exitosamente.', type: Payment })
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePaymentDto: UpdatePaymentDto, @Request() req) {
    return this.paymentsService.update(id, updatePaymentDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Eliminar un pago' })
  @ApiResponse({ status: 200, description: 'El pago ha sido eliminado exitosamente.' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.paymentsService.remove(id, req.user);
  }
}
