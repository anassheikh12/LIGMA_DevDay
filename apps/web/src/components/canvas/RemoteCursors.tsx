'use client';

import { useEffect, useState } from 'react';
import { useEditor } from 'tldraw';
import { useStore } from '@/store';
import { CursorPointer } from './CursorPointer';

export function RemoteCursors() {
  const editor = useEditor();
  const cursors = useStore((s) => s.cursors);
  const removeCursor = useStore((s) => s.removeCursor);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handler = (event: { name: string }) => {
      if (
        event.name === 'pinch' ||
        event.name === 'wheel' ||
        event.name === 'pointer_move'
      ) {
        setTick((t) => t + 1);
      }
    };
    editor.on('event', handler);
    return () => {
      editor.off('event', handler);
    };
  }, [editor]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      cursors.forEach((cursor) => {
        if (now - cursor.lastUpdate > 5000) {
          removeCursor(cursor.userId);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cursors, removeCursor]);

  if (!editor) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from(cursors.values()).map((cursor) => {
        const screen = editor.pageToScreen({ x: cursor.x, y: cursor.y });
        return (
          <div
            key={cursor.userId}
            className="absolute top-0 left-0"
            style={{
              transform: `translate(${screen.x}px, ${screen.y}px)`,
              transition: 'transform 50ms linear',
            }}
          >
            <CursorPointer color={cursor.color} name={cursor.name} />
          </div>
        );
      })}
    </div>
  );
}
