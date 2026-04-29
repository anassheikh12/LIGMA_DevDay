export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  x: number;          // page-space x
  y: number;          // page-space y
  lastUpdate: number; // Date.now() — used for stale detection
}
