import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'true = cliente, false = usuario interno',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isClient?: boolean;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  businessId?: number;

  @ApiProperty({ example: '+34 600 000 000', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
