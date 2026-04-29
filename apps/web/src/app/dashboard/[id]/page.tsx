"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMe, type User } from "@/lib/auth-client";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Editor } from "tldraw";
import * as Y from "yjs";
import { Crown, Edit3, AlertCircle } from "lucide-react";

const LigmaCanvas = dynamic(() => import("@/components/canvas/LigmaCanvas"), {
  ssr: false,
});

const LigmaHub = dynamic(() => import("@/components/canvas/LigmaHub"), {
  ssr: false,
});

const TaskPanel = dynamic(() => import("@/components/canvas/TaskPanel"), {
  ssr: false,
});

type Room = {
  roomId: string;
  title: string;
  ownerId: string;
};

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: roomId } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [membership, setMembership] = useState<{ color: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [yData, setYData] = useState<{ doc: Y.Doc; awareness: any } | null>(null);
  const [role, setRole] = useState<string>("MEMBER");
  const [toast, setToast] = useState<string | null>(null);

  const onEditorMount = useCallback((editor: Editor, doc: Y.Doc, awareness: any) => {
    setEditor(editor);
    setYData({ doc, awareness });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const me = await getMe();
      if (cancelled) return;
      if (!me) {
        router.push("/");
        return;
      }
      setUser(me);

      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setRoom(data);

          const joinRes = await fetch(`/api/rooms/${roomId}/join`, { method: "POST" });
          if (cancelled) return;
          if (joinRes.ok) {
            const joinData = await joinRes.json();
            setMembership({ color: joinData.color });
          } else {
            router.push("/dashboard");
            return;
          }
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error(err);
        router.push("/dashboard");
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, router]);

  // Global Role Logic & Awareness Sync
  useEffect(() => {
    if (!user || !room || !yData) return;

    const { awareness } = yData;
    const isLead = user.userId === room.ownerId;
    const initialRole = isLead ? "LEAD" : "MEMBER";
    
    setRole(initialRole);

    // Set awareness state
    awareness.setLocalStateField("user", {
      userId: user.userId,
      name: user.name,
      role: initialRole,
    });

    // Shared Room Metadata (Lead Authority)
    const roomMetadata = yData.doc.getMap("roomMetadata");
    if (isLead) {
      roomMetadata.set("leadId", user.userId);
    }

    const handleAwarenessUpdate = () => {
      const states = Array.from(awareness.getStates().values()) as any[];
      const myState = states.find((s) => s.user?.userId === user.userId);
      if (myState?.user?.role && myState.user.role !== role) {
        setRole(myState.user.role);
      }
    };

    awareness.on("update", handleAwarenessUpdate);

    // Watch chat for promotion system messages
    const chatArray = yData.doc.getArray("ligma-chat-v1");
    const handleChatUpdate = () => {
      const lastMsg = chatArray.get(chatArray.length - 1) as any;
      if (lastMsg?.role === "SYSTEM" && lastMsg.text.includes(`@${user.name} has been promoted to AUTHOR`)) {
        // Update local awareness role
        awareness.setLocalStateField("user", {
          ...awareness.getLocalState().user,
          role: "AUTHOR",
        });
        setRole("AUTHOR");
      }
    };
    chatArray.observe(handleChatUpdate);

    return () => {
      awareness.off("update", handleAwarenessUpdate);
      chatArray.unobserve(handleChatUpdate);
    };
  }, [user, room, yData]);

  // Toast listener
  useEffect(() => {
    const handleToast = (e: any) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener('ligma-toast', handleToast);
    return () => window.removeEventListener('ligma-toast', handleToast);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleGrid = () => {
    if (editor) {
      editor.updateInstanceState({ isGridMode: !editor.getInstanceState().isGridMode });
    }
  };

  if (loading || !user || !room || !membership) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="font-display text-2xl font-black animate-pulse uppercase tracking-tighter">
          Initializing Session...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100svh] flex flex-col bg-surface-0 bg-dot-grid overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[20000] bg-black text-[#00FF00] border-4 border-black shadow-[8px_8px_0px_0px_#000] px-6 py-3 flex items-center gap-3 animate-bounce">
          <AlertCircle className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest text-sm">{toast}</span>
        </div>
      )}

      {/* Room Header */}
      <header className="flex-none border-b-4 border-black bg-white flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-0 md:h-20 relative z-[10001] gap-3 md:gap-0">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/dashboard" className="font-display text-xl md:text-2xl font-black italic tracking-tighter hover:text-ink-muted transition-colors mr-4">
            LIGMA {"//"}
          </Link>
          
          <div className="bg-accent-yellow border-2 border-black px-4 md:px-6 py-1.5 md:py-2 shadow-[4px_4px_0px_0px_#000] flex items-center gap-2">
            {role === "LEAD" ? <Crown className="w-4 h-4" /> : role === "AUTHOR" ? <Edit3 className="w-4 h-4" /> : null}
            <span className="font-display font-black uppercase italic text-xs md:text-sm tracking-tight truncate max-w-[150px] md:max-w-xs">
              {role}: {room.title}
            </span>
          </div>
        </div>

        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex items-center gap-2 md:gap-3 min-w-max">
            <button onClick={handleToggleGrid} className="min-h-[44px] px-4 py-2 bg-white hover:bg-neutral-100 font-black text-[10px] uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              GRID
            </button>
            <button onClick={handleCopyCode} className={`min-h-[44px] px-4 py-2 font-black text-[10px] uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${copiedCode ? 'bg-lime-400' : 'bg-white hover:bg-neutral-100'}`}>
              {copiedCode ? 'COPIED' : 'CODE'}
            </button>
            <button onClick={handleCopyLink} className={`min-h-[44px] px-4 py-2 font-black text-[10px] uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${copiedLink ? 'bg-lime-400' : 'bg-cyan-400 hover:bg-cyan-500'}`}>
              {copiedLink ? 'COPIED' : 'LINK'}
            </button>
            <button onClick={() => router.push("/dashboard")} className="min-h-[44px] px-4 py-2 bg-white hover:bg-neutral-100 font-black text-[10px] uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              LEAVE
            </button>
          </div>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-white overflow-hidden">
          <LigmaCanvas
            roomId={roomId}
            user={{ userId: user.userId, name: user.name, color: membership.color }}
            userName={user.name}
            role={role}
            onEditorMount={onEditorMount}
          />
        </div>
      </main>

      {yData && (
        <>
          <LigmaHub 
            doc={yData.doc} 
            awareness={yData.awareness} 
            user={user} 
            currentRole={role} 
            editor={editor}
          />
          <TaskPanel editor={editor} />
        </>
      )}
    </div>
  );
}
