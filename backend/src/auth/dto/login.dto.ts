import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'cliente@demo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'cliente123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
