import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Peluquería Estilo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Calle Mayor 1, Madrid' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '600123456' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'contacto@peluqueria.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Servicios de peluquería y estética', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'openingTime must be in HH:mm format' })
  openingTime: string;

  @ApiProperty({ example: '20:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'closingTime must be in HH:mm format' })
  closingTime: string;
}
