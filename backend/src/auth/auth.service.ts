import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PublicUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { verifyPassword } from './password.utils';

type TokenPayload = {
  sub: number;
  email: string;
  isClient: boolean;
  role: string;
  businessId: number | null;
  exp: number;
};

type AuthResponse = {
  accessToken: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  private readonly tokenTtlSeconds = 60 * 60 * 24;

  constructor(private readonly usersService: UsersService) {}

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

    const publicUser = await this.usersService.findOne(user.id);

    return {
      accessToken: this.signAccessToken(publicUser),
      user: publicUser,
    };
  }

  async getCurrentUser(authorizationHeader?: string): Promise<PublicUser> {
    const token = this.extractBearerToken(authorizationHeader);
    const payload = this.verifyAccessToken(token);
    return this.usersService.findOne(payload.sub);
  }

  private signAccessToken(user: PublicUser): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      isClient: user.isClient,
      role: user.role,
      businessId: user.businessId,
      exp: Math.floor(Date.now() / 1000) + this.tokenTtlSeconds,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyAccessToken(token: string): TokenPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Token inválido');
    }

    const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      throw new UnauthorizedException('Token inválido');
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expirado');
    }

    return payload;
  }

  private extractBearerToken(authorizationHeader?: string): string {
    const [type, token] = authorizationHeader?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    return token;
  }

  private sign(value: string): string {
    return createHmac('sha256', this.getJwtSecret()).update(value).digest('base64url');
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }

  private getJwtSecret(): string {
    return process.env.JWT_SECRET || 'dev-secret-change-me';
  }
}
