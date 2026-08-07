import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Env } from '../../config/env.validation';
import { REFRESH_COOKIE } from '../auth-cookie.service';
import { RefreshRequestUser, RefreshTokenPayload } from '../types/auth.types';

const fromCookie = (req: Request): string | null =>
  (req?.cookies?.[REFRESH_COOKIE] as string | undefined) ?? null;

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_REFRESH_SECRET', { infer: true }),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshTokenPayload): RefreshRequestUser {
    const refreshToken = fromCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Не передано refresh-токен');
    }
    return { id: payload.sub, jti: payload.jti, refreshToken };
  }
}
