import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { Business } from './business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all businesses' })
  @ApiResponse({ status: 200, type: [Business] })
  findAll(): Promise<Business[]> {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a business by ID' })
  @ApiResponse({ status: 200, type: Business })
  @ApiResponse({ status: 404, description: 'Business not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Business> {
    return this.businessesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, type: Business })
  create(@Body() createBusinessDto: CreateBusinessDto): Promise<Business> {
    return this.businessesService.create(createBusinessDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a business' })
  @ApiResponse({ status: 200, type: Business })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a business' })
  @ApiResponse({ status: 204, description: 'Business deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.businessesService.remove(id);
  }
}
