import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de pelo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Corte clásico con lavado incluido', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 25.0, description: 'Precio en euros' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({ example: 45, description: 'Duración estimada en minutos', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 1, description: 'ID del negocio al que pertenece el servicio' })
  @IsInt()
  @IsPositive()
  businessId: number;
}
