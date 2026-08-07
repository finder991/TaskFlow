import { io, type Socket } from 'socket.io-client';
import { WS_URL } from '@/shared/config';

export function createSocket(): Socket {
  return io(WS_URL, {
    withCredentials: true,
    transports: ['websocket'],
    autoConnect: true,
  });
}

export const REALTIME_EVENTS = {
  taskCreated: 'task:created',
  taskUpdated: 'task:updated',
  taskDeleted: 'task:deleted',
  commentCreated: 'comment:created',
  commentUpdated: 'comment:updated',
  commentDeleted: 'comment:deleted',
} as const;
