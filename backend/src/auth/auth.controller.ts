import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un usuario y devolver token de acceso' })
  @ApiResponse({ status: 201, description: 'Usuario registrado correctamente.' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiResponse({ status: 201, description: 'Login correcto. Retorna token y usuario.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el usuario autenticado desde el token' })
  @ApiResponse({ status: 200, description: 'Retorna el usuario autenticado.' })
  me(@Request() req) {
    return req.user;
  }
}
