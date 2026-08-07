import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket as IoSocket } from 'socket.io';
import { ACCESS_COOKIE } from '../auth/auth-cookie.service';

interface SocketData {
  userId: string;
  email: string;
}

type Socket = IoSocket<
  Record<string, (...args: never[]) => void>,
  Record<string, (...args: never[]) => void>,
  Record<string, (...args: never[]) => void>,
  SocketData
>;
import { AccessControlService } from '../common/access/access-control.service';
import { Env } from '../config/env.validation';
import { projectRoom, RealtimeEventName } from './realtime.events';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly access: AccessControlService,
  ) {}

  private readCookie(rawCookie: string, name: string): string | undefined {
    for (const part of rawCookie.split(';')) {
      const separator = part.indexOf('=');
      if (separator === -1) continue;
      if (part.slice(0, separator).trim() === name) {
        return decodeURIComponent(part.slice(separator + 1).trim());
      }
    }
    return undefined;
  }

  private extractToken(client: Socket): string | undefined {
    const rawCookie = client.handshake.headers?.cookie;
    if (rawCookie) {
      const fromCookie = this.readCookie(rawCookie, ACCESS_COOKIE);
      if (fromCookie) return fromCookie;
    }
    return client.handshake.auth?.token as string | undefined;
  }

  handleConnection(client: Socket): void {
    const token = this.extractToken(client);
    try {
      const payload = this.jwt.verify<{ sub: string; email: string }>(
        token ?? '',
        {
          secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        },
      );
      client.data.userId = payload.sub;
      client.data.email = payload.email;
    } catch {
      this.logger.debug('WS: відхилено підключення з недійсним токеном');
      client.disconnect(true);
    }
  }

  @SubscribeMessage('project:join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ): Promise<{ ok: boolean }> {
    const userId: string | undefined = client.data.userId;
    if (!userId || typeof projectId !== 'string') {
      return { ok: false };
    }
    try {
      await this.access.requireProjectAccess(userId, projectId);
      await client.join(projectRoom(projectId));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  @SubscribeMessage('project:leave')
  async onLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ): Promise<{ ok: boolean }> {
    if (typeof projectId === 'string') {
      await client.leave(projectRoom(projectId));
    }
    return { ok: true };
  }

  emitToProject(
    projectId: string,
    event: RealtimeEventName,
    payload: unknown,
  ): void {
    this.server?.to(projectRoom(projectId)).emit(event, payload);
  }

  async disconnectFromWorkspace(userId: string): Promise<void> {
    const sockets = (await this.server?.fetchSockets()) ?? [];
    for (const socket of sockets as unknown as Array<{
      data: Partial<SocketData>;
      disconnect: () => void;
    }>) {
      if (socket.data?.userId === userId) {
        socket.disconnect();
      }
    }
  }
}
