import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get all services, optionally filtered by businessId' })
  @ApiQuery({ name: 'businessId', required: false, type: Number })
  @ApiResponse({ status: 200, type: [Service] })
  findAll(@Query('businessId') businessId?: string): Promise<Service[]> {
    return this.servicesService.findAll(businessId ? +businessId : undefined);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, type: Service })
  @ApiResponse({ status: 404, description: 'Service not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Service> {
    return this.servicesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Create a new service for a business' })
  @ApiResponse({ status: 201, type: Service })
  create(
    @Body() createServiceDto: CreateServiceDto,
    @Request() req,
  ): Promise<Service> {
    return this.servicesService.create(createServiceDto, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, type: Service })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req,
  ): Promise<Service> {
    return this.servicesService.update(id, updateServiceDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.servicesService.remove(id, req.user);
  }
}
