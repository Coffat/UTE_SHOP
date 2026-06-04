import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';

export interface SocketAuthUser {
  id: string;
  email: string;
  role: string;
}

const parseCookieHeader = (cookieHeader: string | undefined) => {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;

  for (const chunk of cookieHeader.split(';')) {
    const [rawKey, ...rest] = chunk.trim().split('=');
    if (!rawKey) continue;
    result[rawKey] = decodeURIComponent(rest.join('='));
  }
  return result;
};

export const authenticateSocket = (socket: Socket): SocketAuthUser => {
  const cookies = parseCookieHeader(socket.handshake.headers.cookie);
  const handshakeAuth = socket.handshake.auth as { accessToken?: string; token?: string } | undefined;
  const token = cookies.accessToken || handshakeAuth?.accessToken || handshakeAuth?.token;
  if (!token) {
    throw new Error('Socket unauthorized: accessToken not found in cookie');
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    console.error('[CHAT SOCKET] ACCESS_TOKEN_SECRET is missing');
    throw new Error('Socket unauthorized');
  }

  const decoded = jwt.verify(token, secret) as SocketAuthUser;
  if (!decoded?.id || !decoded?.role) {
    throw new Error('Socket unauthorized: invalid token payload');
  }

  return decoded;
};
