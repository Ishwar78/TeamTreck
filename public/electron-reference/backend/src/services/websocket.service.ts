import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  auth_data?: { user_id: string; company_id: string; role: string };
}

let io: SocketIOServer;

export function initWebSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    path: '/ws',
    pingInterval: 25000,
    pingTimeout: 10000,
  });

  // JWT authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Missing authentication token'));

    try {
      const payload = jwt.verify(
  token as string,
  env.JWT_PUBLIC_KEY as string,
  {
    algorithms: ['HS256']
  }
) as any;
 
      socket.auth_data = {
        user_id: payload.user_id,
        company_id: payload.company_id,
        role: payload.role,
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const { user_id, company_id, role } = socket.auth_data!;

    // Join company room
    socket.join(`company:${company_id}`);

    // Admins join admin-specific room
    if (role === 'company_admin' || role === 'sub_admin') {
      socket.join(`admin:${company_id}`);
    }

    logger.info(`WS connected: user=${user_id} company=${company_id} role=${role}`);

    socket.on('disconnect', () => {
      logger.debug(`WS disconnected: user=${user_id}`);
    });
  });

  return io;
}

/** Broadcast to all admin sockets in a company */
export function broadcastToAdmins(companyId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`admin:${companyId}`).emit(event, {
    data,
    timestamp: new Date().toISOString(),
  });
}

/** Broadcast to all users in a company */
export function broadcastToCompany(companyId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`company:${companyId}`).emit(event, {
    data,
    timestamp: new Date().toISOString(),
  });
}

/** Send to a specific user */
export function sendToUser(companyId: string, userId: string, event: string, data: unknown): void {
  if (!io) return;
  const room = io.sockets.adapter.rooms.get(`company:${companyId}`);
  if (!room) return;

  for (const socketId of room) {
    const socket = io.sockets.sockets.get(socketId) as AuthenticatedSocket | undefined;
    if (socket?.auth_data?.user_id === userId) {
      socket.emit(event, { data, timestamp: new Date().toISOString() });
    }
  }
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
