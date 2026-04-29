"use client";

import { Tldraw, Editor, TldrawUiOverrides, ToolbarItem, DefaultToolbar, DefaultToolbarContent } from "tldraw";
import "tldraw/tldraw.css";
import { useYjsStore } from "./useYjsStore";
import * as Y from "yjs";
import { useEffect, useState } from "react";
import { useCursorPresence } from "@/hooks/useCursorPresence";
import { RemoteCursors } from "./RemoteCursors";

type CanvasUser = { userId: string; name: string; color: string };

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
    hostUrl: "ws://localhost:4000",
  });

  const [editor, setEditor] = useState<Editor | null>(null);

  // Tool definitions
  const MEMBER_TOOLS = ['hand', 'draw', 'eraser'];
  const AUTHOR_TOOLS = [...MEMBER_TOOLS, 'note', 'geo', 'arrow'];
  const LEAD_TOOLS = ['all']; // Full access

  useEffect(() => {
    if (!editor) return;

    const handleToolChange = () => {
      const toolId = editor.getCurrentToolId();
      
      const isAllowed = role === 'LEAD' || 
                        (role === 'AUTHOR' && AUTHOR_TOOLS.includes(toolId)) ||
                        (role === 'MEMBER' && MEMBER_TOOLS.includes(toolId)) ||
                        toolId === 'select';

      if (!isAllowed) {
        window.dispatchEvent(new CustomEvent('ligma-toast', { detail: 'COMMAND LEVEL INSUFFICIENT' }));
        // Revert to select tool
        editor.setCurrentTool('select');
      }
    };

    editor.on('current-tool-change', handleToolChange);

    // RBAC: Block unauthorized edits to LeadOnly shapes
    const cleanupChange = editor.sideEffects.registerBeforeChangeHandler('shape', (prev, next, source) => {
      if (source !== 'user') return next;
      if (!prev) return next; // Allow new shapes
      
      const isLeadOnly = prev.meta?.isLeadOnly === true;
      if (isLeadOnly && role !== 'LEAD') {
         window.dispatchEvent(new CustomEvent('ligma-toast', { detail: 'ACCESS DENIED: LEAD ONLY TASK' }));
         return prev; // Block change
      }
      return next;
    });

    // RBAC: Block unauthorized deletions
    const cleanupDelete = editor.sideEffects.registerBeforeDeleteHandler('shape', (shape, source) => {
      if (source !== 'user') return true;
      
      const isLeadOnly = shape.meta?.isLeadOnly === true;
      if (isLeadOnly && role !== 'LEAD') {
         window.dispatchEvent(new CustomEvent('ligma-toast', { detail: 'ACCESS DENIED: LEAD ONLY TASK' }));
         return false; // Block deletion
      }
      return true;
    });

    return () => {
      editor.off('current-tool-change', handleToolChange);
      cleanupChange();
      cleanupDelete();
    };
  }, [editor, role]);

  const overrides: TldrawUiOverrides = {
    tools: (editor, tools) => {
      if (role === 'LEAD') return tools;
      
      const allowed = role === 'AUTHOR' ? AUTHOR_TOOLS : MEMBER_TOOLS;
      const filteredTools = { ...tools };
      
      Object.keys(tools).forEach(key => {
        if (!allowed.includes(key) && key !== 'select') {
          delete filteredTools[key];
        }
      });
      
      return filteredTools;
    }
  };

  useEffect(() => {
    if (editor && doc && awareness) {
      onEditorMount?.(editor, doc, awareness);
    }
  }, [editor, doc, awareness, onEditorMount]);

  return (
    <div className="w-full h-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden relative">
      <Tldraw
        store={store}
        overrides={overrides}
        onMount={(editor) => {
          setEditor(editor);
          editor.user.updateUserPreferences({ name: userName });
        }}
      >
        <CanvasInner roomId={roomId} user={user} />
      </Tldraw>
    </div>
  );
}
