import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserRole } from '../users/user.entity';
import { PublicUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { verifyPassword } from './password.utils';

type AuthResponse = {
  accessToken: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const user = await this.usersService.create(createUserDto);
    return {
      accessToken: this.signAccessToken(user),
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);

    if (!user?.passwordHash || !(await verifyPassword(loginDto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.assertSupportedRole(user.role);

    const publicUser = await this.usersService.findOne(user.id);

    return {
      accessToken: this.signAccessToken(publicUser),
      user: publicUser,
    };
  }

  private signAccessToken(user: PublicUser): string {
    this.assertSupportedRole(user.role);

    const payload = {
      sub: user.id,
      email: user.email,
      isClient: user.isClient,
      role: user.role,
      businessId: user.businessId,
    };

    return this.jwtService.sign(payload);
  }

  private assertSupportedRole(role?: string | null) {
    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      throw new UnauthorizedException('El usuario tiene un rol no soportado');
    }
  }
}
