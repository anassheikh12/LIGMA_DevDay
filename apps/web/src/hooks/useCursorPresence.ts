'use client';

import { useEffect } from 'react';
import { useEditor } from 'tldraw';
import throttle from 'lodash.throttle';
import { connectSocket } from '@/lib/socket';
import { useStore } from '@/store';

interface Args {
  roomId: string;
  user: { userId: string; name: string; color: string } | null;
}

interface CursorUpdatePayload {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export function useCursorPresence({ roomId, user }: Args): void {
  const editor = useEditor();
  const upsertCursor = useStore((s) => s.upsertCursor);
  const removeCursor = useStore((s) => s.removeCursor);
  const clearCursors = useStore((s) => s.clearCursors);

  useEffect(() => {
    if (!user || !editor) return;

    const socket = connectSocket();

    const onJoin = () => {
      socket.emit('room:join', { roomId });
    };

    if (socket.connected) {
      onJoin();
    } else {
      socket.once('connect', onJoin);
    }

    const onCursorUpdate = (payload: CursorUpdatePayload) => {
      if (payload.userId === user.userId) return;
      upsertCursor({ ...payload, lastUpdate: Date.now() });
    };

    const onCursorLeave = (payload: { userId: string }) => {
      removeCursor(payload.userId);
    };

    socket.on('cursor:update', onCursorUpdate);
    socket.on('cursor:leave', onCursorLeave);

    const emitMove = throttle((x: number, y: number) => {
      socket.emit('cursor:move', { roomId, x, y });
    }, 33);

    const editorEventHandler = (event: { name: string }) => {
      if (event.name !== 'pointer_move') return;
      const point = editor.inputs.currentPagePoint;
      emitMove(point.x, point.y);
    };

    editor.on('event', editorEventHandler);

    return () => {
      socket.off('cursor:update', onCursorUpdate);
      socket.off('cursor:leave', onCursorLeave);
      socket.off('connect', onJoin);
      editor.off('event', editorEventHandler);
      emitMove.cancel();
      clearCursors();
    };
  }, [editor, roomId, user, upsertCursor, removeCursor, clearCursors]);
}
