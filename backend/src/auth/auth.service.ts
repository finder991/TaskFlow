import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { Env } from '../config/env.validation';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { TokenService } from './token.service';
import { AuthResult } from './types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Користувач із таким email уже існує');
    }
    const saltRounds = this.config.get('BCRYPT_SALT_ROUNDS', { infer: true });
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    this.logger.log(`Зареєстровано користувача ${user.id}`);
    return this.buildResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);

    const invalid = new UnauthorizedException('Невірний email або пароль');
    if (!user) {
      throw invalid;
    }
    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      this.logger.warn(`Невдала спроба входу для користувача ${user.id}`);
      throw invalid;
    }
    this.logger.log(`Вхід користувача ${user.id}`);
    return this.buildResult(user);
  }

  async refresh(
    userId: string,
    jti: string,
    presentedToken: string,
  ): Promise<AuthResult> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const tokens = await this.tokens.rotate(
      user.id,
      user.email,
      jti,
      presentedToken,
    );
    return { user: UserResponseDto.from(user), tokens };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await this.tokens.revokeByToken(refreshToken);
  }

  private async buildResult(user: User): Promise<AuthResult> {
    const tokens = await this.tokens.issueTokenPair(user.id, user.email);
    return { user: UserResponseDto.from(user), tokens };
  }
}
