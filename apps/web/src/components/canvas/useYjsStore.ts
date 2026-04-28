import {
  TLRecord,
  TLStore,
  createTLStore,
  defaultShapeUtils,
  transact,
} from 'tldraw';
import { useEffect, useState } from 'react';
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
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: defaultShapeUtils,
    });
    return store;
  });

  const [status, setStatus] = useState({ type: 'loading' });

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(hostUrl, roomId, doc, {
      connect: true,
    });

    const yStore = doc.getMap<TLRecord>('tldraw');

    // Sync from Yjs to TLStore
    const unobserve = () => {
      yStore.unobserve(handleYUpdate);
    };

    const handleYUpdate = (event: Y.YMapEvent<TLRecord>) => {
      const { keysChanged } = event;
      const changes: TLRecord[] = [];
      const removals: any[] = [];

      keysChanged.forEach((key) => {
        const record = yStore.get(key);
        if (record) {
          changes.push(record);
        } else {
          removals.push(key);
        }
      });

      store.mergeRemoteChanges(() => {
        if (changes.length) store.put(changes);
        if (removals.length) store.remove(removals);
      });
    };

    yStore.observe(handleYUpdate);

    // Initial sync
    const initialRecords = Array.from(yStore.values());
    if (initialRecords.length > 0) {
      store.mergeRemoteChanges(() => {
        store.put(initialRecords);
      });
    }

    // Sync from TLStore to Yjs
    const unlisten = store.listen(
      ({ changes }) => {
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
      if (status === 'connected') {
        setStatus({ type: 'ready' });
      }
    });

    return () => {
      unobserve();
      unlisten();
      provider.destroy();
      doc.destroy();
    };
  }, [roomId, hostUrl, store]);

  return store;
}
