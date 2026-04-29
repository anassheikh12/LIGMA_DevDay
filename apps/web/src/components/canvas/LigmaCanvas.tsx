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

  const overrides = useMemo(() => ({
    tools: (editor: Editor, tools: any) => {
      if (role === 'LEAD') return tools;
      const allowed = role === 'AUTHOR' ? AUTHOR_TOOLS : MEMBER_TOOLS;
      const filteredTools = { ...tools };
      Object.keys(tools).forEach(key => {
        if (!allowed.includes(key) && key !== 'select') delete filteredTools[key];
      });
      return filteredTools;
    }
  }), [role]);

  useEffect(() => {
    if (!editor || !doc) return;

    const roomMetadata = doc.getMap("roomMetadata");
    const leadId = roomMetadata.get("leadId");
    const isActuallyLead = leadId === user.userId || role === 'LEAD';

    // 1. Selection Blocker (Prevents even selecting protected shapes)
    const cleanupSelection = (editor.sideEffects as any).registerBeforeChangeHandler('instance_state', (prev: any, next: any, source: any) => {
      if (source !== 'user' || isActuallyLead) return next;
      
      const newlySelected = next.selectedShapeIds.filter((id: string) => !prev.selectedShapeIds.includes(id));
      if (newlySelected.length > 0) {
        const hasForbidden = newlySelected.some((id: string) => {
          const shape = editor.getShape(id as any);
          return (shape as any)?.meta?.isAiGenerated || (shape as any)?.meta?.isLeadOnly;
        });
        
        if (hasForbidden) {
          window.dispatchEvent(new CustomEvent('ligma-toast', { detail: 'ACCESS DENIED: LEAD ONLY TASK' }));
          return { ...next, selectedShapeIds: prev.selectedShapeIds };
        }
      }
      return next;
    });

    // 2. Tool Enforcement
    const disposeStore = editor.store.listen(({ changes }) => {
      const { updated } = changes;
      if (Object.values(updated).some(([prev, next]: any) => 
        prev.typeName === 'instance_state' && prev.activeToolId !== next.activeToolId
      )) {
        const toolId = editor.getCurrentToolId();
        const isAllowed = isActuallyLead || 
                          (role === 'AUTHOR' && AUTHOR_TOOLS.includes(toolId)) ||
                          (role === 'MEMBER' && MEMBER_TOOLS.includes(toolId)) ||
                          toolId === 'select';

        if (!isAllowed) {
          editor.setCurrentTool('select');
        }
      }
    }, { scope: 'local' } as any);

    // 3. Event Logging (Who changed what and when)
    const roomLogs = doc.getArray("room-logs");
    const disposeLogging = editor.store.listen(({ changes }) => {
      const logEntry = (action: string, shape: any) => {
        // Prevent doc growth by capping logs (last 100)
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
      
      // Throttle updates: Only log significant changes (like text edits)
      Object.values(changes.updated).forEach(([prev, next]: any) => {
        if (prev.typeName === 'shape' && (prev.props as any)?.text !== (next.props as any)?.text) {
          logEntry('UPDATED', next);
        }
      });
    }, { source: 'user', scope: 'document' } as any);

    return () => {
      cleanupSelection();
      if (disposeStore) (disposeStore as any)();
      if (disposeLogging) (disposeLogging as any)();
    };
  }, [editor, role, doc, user.userId, userName]);



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