import {
  TLRecord,
  TLStore,
  createTLStore,
  defaultShapeUtils,
} from 'tldraw';
import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function useYjsStore({
  roomId,
  hostUrl,
  version = 1,
}: {
  roomId: string;
  hostUrl: string;
  version?: number;
}) {
  // store is created once and never changes — stable ref
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils })
  );

  const [status, setStatus] = useState({ type: 'loading' });
  const [yData, setYData] = useState<{ doc: Y.Doc; awareness: any } | null>(null);

  // Keep store in a ref so the effect can use it without it being a dep
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    // Guard flag: prevents setting state after this effect has been cleaned up
    let destroyed = false;

    const doc = new Y.Doc();

    // Normalise the host URL to a WebSocket URL
    const wsUrl = hostUrl.startsWith('http')
      ? hostUrl.replace(/^http/, 'ws')
      : hostUrl;

    const provider = new WebsocketProvider(wsUrl, roomId, doc, {
      connect: true,
    });

    // Initialise shared arrays immediately so other hooks can observe them
    doc.getArray('ligma-chat-v1');

    // Expose the doc & awareness right away (before synced)
    if (!destroyed) {
      setYData({ doc, awareness: provider.awareness });
    }

    const yStore = doc.getMap<TLRecord>('tldraw');

    // ── Yjs → TLStore ────────────────────────────────────────────────────
    const handleYUpdate = (event: Y.YMapEvent<TLRecord>) => {
      if (destroyed) return;
      const { keysChanged } = event;
      const changes: TLRecord[] = [];
      const removals: string[] = [];

      keysChanged.forEach((key) => {
        const record = yStore.get(key);
        if (record) {
          changes.push(record);
        } else {
          removals.push(key);
        }
      });

      storeRef.current.mergeRemoteChanges(() => {
        if (changes.length) storeRef.current.put(changes);
        if (removals.length) storeRef.current.remove(removals);
      });
    };

    yStore.observe(handleYUpdate);

    // Initial full-sync: run once when the WebSocket connection is first synced.
    // We use 'synced' (not 'connected') because the document state isn't ready
    // until after the initial Yjs state exchange completes.
    const handleSynced = () => {
      if (destroyed) return;
      const initialRecords = Array.from(yStore.values());
      if (initialRecords.length > 0) {
        storeRef.current.mergeRemoteChanges(() => {
          storeRef.current.put(initialRecords);
        });
      }
      setStatus({ type: 'ready' });
    };

    provider.once('synced', handleSynced);

    // ── TLStore → Yjs ────────────────────────────────────────────────────
    const unlisten = storeRef.current.listen(
      ({ changes }) => {
        if (destroyed) return;
        doc.transact(() => {
          Object.values(changes.added).forEach((record) => {
            yStore.set(record.id, record);
          });
          Object.values(changes.updated).forEach(([_, record]) => {
            yStore.set(record.id, record);
          });
          Object.values(changes.removed).forEach((record) => {
            yStore.delete(record.id);
          });
        });
      },
      { source: 'user', scope: 'document' }
    );

    provider.on('status', ({ status }: { status: string }) => {
      if (!destroyed && status === 'connected') {
        setStatus({ type: 'ready' });
      }
    });

    return () => {
      destroyed = true;
      yStore.unobserve(handleYUpdate);
      unlisten();
      provider.destroy();
      doc.destroy();
      // Clear yData so consumers know the doc is gone
      setYData(null);
    };
    // NOTE: `store` is intentionally omitted from deps — it is stable (useState initializer).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, hostUrl]);

  return { store, doc: yData?.doc, awareness: yData?.awareness };
}
