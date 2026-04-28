"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getMe, type User } from "@/lib/auth-client";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Editor } from "tldraw";

const LigmaCanvas = dynamic(() => import("@/components/canvas/LigmaCanvas"), {
  ssr: false,
});

type Room = {
  roomId: string;
  title: string;
};

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: roomId } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

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
          setRoom(data);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error(err);
        router.push("/dashboard");
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, router]);

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

  if (loading || !user || !room) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="font-display text-2xl font-black animate-pulse uppercase">Connecting to Ligma-Sync...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface-0 bg-dot-grid overflow-hidden">
      {/* Room Header */}
      <header className="h-20 border-b-4 border-black bg-white flex items-center justify-between px-8 relative z-50">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-display text-2xl font-black italic tracking-tighter hover:text-ink-muted">
            LIGMA //
          </Link>
          <div className="bg-black text-white px-4 py-1 font-black uppercase text-xs italic">
            {room.title}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleGrid}
              className="px-4 py-1.5 bg-white hover:bg-neutral-100 font-black text-[10px] uppercase border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              GRID
            </button>
            <button
              onClick={handleCopyCode}
              className={`px-4 py-1.5 font-black text-[10px] uppercase border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                copiedCode ? 'bg-lime-400' : 'bg-white hover:bg-neutral-100'
              }`}
            >
              {copiedCode ? 'CODE COPIED' : 'COPY CODE'}
            </button>
            <button
              onClick={handleCopyLink}
              className={`px-4 py-1.5 font-black text-[10px] uppercase border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                copiedLink ? 'bg-lime-400' : 'bg-cyan-400 hover:bg-cyan-500'
              }`}
            >
              {copiedLink ? 'LINK COPIED' : 'COPY LINK'}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-1.5 bg-white hover:bg-neutral-100 font-black text-[10px] uppercase border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              LEAVE
            </button>
          </div>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="h-[calc(100vh-80px)] p-4 relative overflow-hidden">
        <div className="w-full h-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] relative overflow-hidden">
          <LigmaCanvas 
            roomId={roomId} 
            userName={user.name} 
            onEditorMount={(editor) => setEditor(editor)}
          />
        </div>
      </main>
    </div>
  );
}
