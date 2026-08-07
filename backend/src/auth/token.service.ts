import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { Env } from '../config/env.validation';
import { RefreshTokenRepository } from './refresh-token.repository';
import { TokenPair } from './types/auth.types';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  async issueTokenPair(userId: string, email: string): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES', { infer: true }),
      },
    );

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES', { infer: true }),
      },
    );

    const { exp } = this.jwt.decode<{ exp: number }>(refreshToken);
    await this.refreshTokens.create({
      id: jti,
      userId,
      tokenHash: this.hash(refreshToken),
      expiresAt: new Date(exp * 1000),
    });

    return { accessToken, refreshToken };
  }

  async rotate(
    userId: string,
    email: string,
    jti: string,
    presentedToken: string,
  ): Promise<TokenPair> {
    const record = await this.refreshTokens.findById(jti);

    const isValid =
      record &&
      record.userId === userId &&
      !record.revokedAt &&
      record.expiresAt > new Date() &&
      record.tokenHash === this.hash(presentedToken);

    if (!isValid) {
      await this.refreshTokens.revokeAllForUser(userId);
      throw new UnauthorizedException('Недійсний refresh-токен');
    }

    await this.refreshTokens.revokeById(jti);
    return this.issueTokenPair(userId, email);
  }

  async revokeByToken(refreshToken: string): Promise<void> {
    const payload = this.jwt.decode<{ jti?: string } | null>(refreshToken);
    if (!payload?.jti) return;
    await this.refreshTokens.revokeById(payload.jti);
  }
}
