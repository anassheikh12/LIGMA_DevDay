"use client";

import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useYjsStore } from "./useYjsStore";
import * as Y from "yjs";
import { useEffect, useState } from "react";
import { useCursorPresence } from "@/hooks/useCursorPresence";
import { RemoteCursors } from "./RemoteCursors";
import { EventLogPanel } from "./EventLogPanel";
import { History } from "lucide-react";
import { useMemo } from "react";

type CanvasUser = { userId: string; name: string; color: string };

const MEMBER_TOOLS = ['hand', 'draw', 'eraser'];
const AUTHOR_TOOLS = [...MEMBER_TOOLS, 'note', 'geo', 'arrow'];

function CanvasInner({ roomId, user }: { roomId: string; user: CanvasUser }) {
  useCursorPresence({ roomId, user });
  return <RemoteCursors />;
}

export default function LigmaCanvas({
  roomId,
  user,
  userName,
  onEditorMount,
  role = "MEMBER",
}: {
  roomId: string;
  user: CanvasUser;
  userName: string;
  role?: string;
  onEditorMount?: (editor: Editor, doc: Y.Doc, awareness: any) => void;
}) {
  const { store, doc, awareness } = useYjsStore({
    roomId,
    hostUrl: process.env.NEXT_PUBLIC_REALTIME_URL || "ws://localhost:3001",
  });

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);

  // Sync Protection: Only enforce rules once roomMetadata is resolved
  useEffect(() => {
    if (!doc) return;
    const roomMetadata = doc.getMap("roomMetadata");
    const checkSync = () => {
      const leadId = roomMetadata.get("leadId") as string;
      if (leadId) {
        setCurrentLeadId(leadId);
        setIsSynced(true);
      }
    };
    roomMetadata.observe(checkSync);
    checkSync();
    return () => roomMetadata.unobserve(checkSync);
  }, [doc]);

  const isActuallyLead = isSynced ? (currentLeadId === user.userId || role === 'LEAD') : true;

  // Memoized UI Overrides to prevent flickering/disappearing UI
  const overrides = useMemo(() => {
    if (!isSynced) return {};
    return {
      tools: (editor: Editor, tools: any) => {
        if (isActuallyLead) return tools;
        const allowed = role === 'AUTHOR' ? AUTHOR_TOOLS : MEMBER_TOOLS;
        const filteredTools = { ...tools };
        Object.keys(tools).forEach(key => {
          if (!allowed.includes(key) && key !== 'select') delete filteredTools[key];
        });
        return filteredTools;
      }
    };
  }, [isActuallyLead, isSynced, role]);

  useEffect(() => {
    if (!editor || !doc) return;

    // 1. Ghost Selection Lock (Intersects clicks)
    const disposeGhostLock = editor.on('event', (event) => {
      if (!isSynced || isActuallyLead) return;
      if (event.name === 'pointer_down') {
        const info = (event as any).info;
        if (info?.target === 'shape') {
          const shape = editor.getShape(info.shape.id as any);
          if (shape?.meta?.isAiGenerated || shape?.meta?.isLeadOnly) {
            editor.selectNone();
            window.dispatchEvent(new CustomEvent('ligma-toast', { detail: 'COMMAND LEVEL INSUFFICIENT' }));
          }
        }
      }
    });

    // 2. Tool Enforcement (Fallback)
    const disposeStore = editor.store.listen(({ changes }) => {
      if (!isSynced || isActuallyLead) return;
      const { updated } = changes;
      if (Object.values(updated).some(([prev, next]: any) => 
        prev.typeName === 'instance' && prev.activeToolId !== next.activeToolId
      )) {
        const toolId = editor.getCurrentToolId();
        const allowed = role === 'AUTHOR' ? AUTHOR_TOOLS : MEMBER_TOOLS;
        const isAllowed = allowed.includes(toolId) || toolId === 'select';
        if (!isAllowed) editor.setCurrentTool('select');
      }
    }, { scope: 'local' } as any);

    // 3. Event Logging
    const roomLogs = doc.getArray("room-logs");
    const disposeLogging = editor.store.listen(({ changes }) => {
      const logEntry = (action: string, shape: any) => {
        if (roomLogs.length > 100) roomLogs.delete(0, 1);
        roomLogs.push([{
          user: userName,
          action: action as any,
          shapeType: shape.type,
          timestamp: Date.now()
        }]);
      };
      Object.values(changes.added).forEach(shape => logEntry('CREATED', shape));
      Object.values(changes.removed).forEach(shape => logEntry('DELETED', shape));
      Object.values(changes.updated).forEach(([prev, next]: any) => {
        if (prev.typeName === 'shape' && (prev.props as any)?.text !== (next.props as any)?.text) {
          logEntry('UPDATED', next);
        }
      });
    }, { source: 'user', scope: 'document' } as any);

    return () => {
      if (disposeGhostLock) (disposeGhostLock as any)();
      if (disposeStore) (disposeStore as any)();
      if (disposeLogging) (disposeLogging as any)();
    };
  }, [editor, isActuallyLead, isSynced, doc, userName, role]);



  useEffect(() => {
    if (editor && doc && awareness) {
      onEditorMount?.(editor, doc, awareness);
    }
  }, [editor, doc, awareness, onEditorMount]);

  return (
    <div className="w-full h-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden relative">
      <Tldraw
        store={store as any}
        overrides={overrides}
        onMount={(ed) => {
          setEditor(ed);
          try {
            (ed.user as any).update({ name: userName });
          } catch (e) {
            (ed.user as any).updateUserPreferences({ name: userName });
          }
        }}
      >
        <CanvasInner roomId={roomId} user={user} />
      </Tldraw>

      {/* Event Log Toggle */}
      <button 
        onClick={() => setIsLogOpen(!isLogOpen)}
        className="absolute right-6 top-6 z-[99999] w-12 h-12 bg-black text-white border-2 border-white shadow-[4px_4px_0px_0px_#000] flex items-center justify-center hover:bg-neutral-800 transition-all"
      >
        <History className="w-6 h-6" />
      </button>

      {doc && (
        <EventLogPanel 
          doc={doc} 
          isOpen={isLogOpen} 
          onClose={() => setIsLogOpen(false)} 
        />
      )}
    </div>
  );
}