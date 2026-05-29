import { io } from 'socket.io-client';
import { getToken } from '../api/client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
