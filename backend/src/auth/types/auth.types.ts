import { UserResponseDto } from '../../users/dto/user-response.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface RefreshRequestUser {
  id: string;
  jti: string;
  refreshToken: string;
}

export interface AuthResult {
  user: UserResponseDto;
  tokens: TokenPair;
}
