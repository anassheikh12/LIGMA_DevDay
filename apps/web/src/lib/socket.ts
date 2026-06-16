import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    let url = process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4000';
    
    // Sanitize protocol for Socket.IO
    if (url.startsWith('ws')) {
      url = url.replace(/^ws/, 'http');
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
      url = `${protocol}//${url}`;
    }

    socket = io(url, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
