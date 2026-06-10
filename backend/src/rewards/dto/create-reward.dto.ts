import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ example: 'Corte de pelo gratis' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Válido por un corte estándar' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Servicio', required: false })
  @IsString()
  @IsOptional()
  type?: string = 'Servicio';

  @ApiProperty({ example: 100 })
  @IsNumber()
  pointsCost: number;

  @ApiProperty({ example: '2027-12-31' })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}
