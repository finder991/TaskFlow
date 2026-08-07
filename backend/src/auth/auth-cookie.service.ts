import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { Env } from '../config/env.validation';
import { TokenPair } from './types/auth.types';

export const ACCESS_COOKIE = 'taskflow_access';
export const REFRESH_COOKIE = 'taskflow_refresh';

const REFRESH_COOKIE_PATH = '/api/auth';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get isProduction(): boolean {
    return this.config.get('NODE_ENV', { infer: true }) === 'production';
  }

  private baseOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction,

      sameSite: 'lax',
    };
  }

  setAuthCookies(res: Response, tokens: TokenPair): void {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.baseOptions(),
      path: '/',
      maxAge: this.config.get('ACCESS_COOKIE_MAX_AGE', { infer: true }),
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.baseOptions(),
      path: REFRESH_COOKIE_PATH,
      maxAge: this.config.get('REFRESH_COOKIE_MAX_AGE', { infer: true }),
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, { ...this.baseOptions(), path: '/' });
    res.clearCookie(REFRESH_COOKIE, {
      ...this.baseOptions(),
      path: REFRESH_COOKIE_PATH,
    });
  }
}
