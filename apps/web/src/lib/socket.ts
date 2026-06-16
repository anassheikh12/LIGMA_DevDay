import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Normalise the NEXT_PUBLIC_REALTIME_URL to an http/https URL for Socket.IO.
 * Socket.IO requires http/https for its handshake even when it ultimately
 * upgrades to a WebSocket connection.
 */
function getRealtimeHttpUrl(): string {
  let url = process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4000';

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');

  if (url.startsWith('wss://')) {
    url = 'https://' + url.slice(6);
  } else if (url.startsWith('ws://')) {
    url = 'http://' + url.slice(5);
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Bare hostname — assume https in production
    url = 'https://' + url;
  }

  return url;
}

export function getSocket(): Socket {
  if (!socket) {
    const url = getRealtimeHttpUrl();

    socket = io(url, {
      withCredentials: true,
      autoConnect: false,
      // Prefer WebSocket transport; fall back to polling only if WebSocket is
      // blocked (e.g., some reverse proxies). Using websocket-first avoids the
      // cross-origin cookie issues that come with long-polling.
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(authData?: { userId: string; name: string }) {
  const s = getSocket();
  if (authData) {
    s.auth = authData;
  }
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
