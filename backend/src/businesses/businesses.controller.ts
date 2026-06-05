import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { Business } from './business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('businesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get all businesses' })
  @ApiResponse({ status: 200, type: [Business] })
  findAll(): Promise<Business[]> {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get a business by ID' })
  @ApiResponse({ status: 200, type: Business })
  @ApiResponse({ status: 404, description: 'Business not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Business> {
    return this.businessesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, type: Business })
  create(@Body() createBusinessDto: CreateBusinessDto): Promise<Business> {
    return this.businessesService.create(createBusinessDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Update a business' })
  @ApiResponse({ status: 200, type: Business })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @Request() req,
  ): Promise<Business> {
    return this.businessesService.update(id, updateBusinessDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a business' })
  @ApiResponse({ status: 204, description: 'Business deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.businessesService.remove(id);
  }
}
