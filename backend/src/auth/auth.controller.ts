import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthCookieService, REFRESH_COOKIE } from './auth-cookie.service';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  LoginDto,
  MessageResponseDto,
  RegisterDto,
} from './dto/auth.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { AuthResult, RefreshRequestUser } from './types/auth.types';

const AUTH_THROTTLE = {
  default: {
    limit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 5),
    ttl: 60_000,
  },
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public()
  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({
    summary: 'Реєстрація нового користувача (токени — у httpOnly-cookie)',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.respondWithCookies(await this.auth.register(dto), res);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Логін (токени — у httpOnly-cookie)' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.respondWithCookies(await this.auth.login(dto), res);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Оновлення пари токенів за refresh-cookie (з ротацією)',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { id, jti, refreshToken } = req.user as RefreshRequestUser;
    return this.respondWithCookies(
      await this.auth.refresh(id, jti, refreshToken),
      res,
    );
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Вихід — відкликання refresh-токена й очищення cookie',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponseDto> {
    const refreshToken = (req.cookies as Record<string, string | undefined>)?.[
      REFRESH_COOKIE
    ];
    await this.auth.logout(refreshToken);
    this.cookies.clearAuthCookies(res);
    return { success: true };
  }

  private respondWithCookies(
    result: AuthResult,
    res: Response,
  ): AuthResponseDto {
    this.cookies.setAuthCookies(res, result.tokens);
    return { user: result.user };
  }
}
