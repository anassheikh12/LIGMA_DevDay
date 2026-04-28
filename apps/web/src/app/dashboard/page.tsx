"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, type User } from "@/lib/auth-client";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import CreateRoomCard from "@/components/dashboard/CreateRoomCard";
import JoinRoomCard from "@/components/dashboard/JoinRoomCard";
import StickyNoteBackground from "@/components/dashboard/StickyNoteBackground";
import dynamic from "next/dynamic";
import Link from "next/link";

const FloatingCursors = dynamic(() => import("@/components/FloatingCursors"), {
  ssr: false,
});

type Room = {
  roomId: string;
  title: string;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch rooms
      try {
        const res = await fetch("/api/rooms/list");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="font-display text-2xl font-black animate-pulse">LOADING LIGMA...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 bg-dot-grid relative flex flex-col">
      <StickyNoteBackground />
      <FloatingCursors zIndex="z-0" />
      <DashboardTopbar userName={user.name} />

      <div className="flex-1 flex relative z-10">
        {/* Sidebar (25%) */}
        <aside className="w-1/4 border-r-4 border-black bg-white/80 backdrop-blur-sm p-8 min-h-screen">
          <h2 className="font-display text-2xl font-black text-ink mb-6 uppercase italic tracking-tight">
            Recent Rooms
          </h2>
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <p className="text-ink-muted text-sm italic">No active sessions found.</p>
            ) : (
              rooms.map((room) => (
                <Link
                  key={room.roomId}
                  href={`/dashboard/${room.roomId}`}
                  className="block bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
                >
                  <div className="font-display font-black text-ink group-hover:text-ink-muted">
                    {room.title}
                  </div>
                  <div className="text-[10px] text-ink-subtle uppercase font-bold mt-1">
                    ID: {room.roomId}
                  </div>
                </Link>
              ))
            )}
          </div>
        </aside>

        {/* Main Stage (75%) */}
        <main className="w-3/4 p-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl font-black text-ink mb-2 uppercase italic tracking-tighter">
              Welcome back, {user.name}
            </h1>
            <p className="font-display text-6xl font-black text-ink mb-12 uppercase italic tracking-tighter leading-[0.9]">
              Control Center
            </p>

            <div className="flex gap-8">
              <CreateRoomCard />
              <JoinRoomCard />
            </div>

            <div className="mt-16 bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_#000]">
              <h2 className="font-display text-3xl font-black text-ink mb-4 uppercase italic">
                System Status
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="border-2 border-black p-4 bg-lime-400 shadow-[4px_4px_0px_0px_#000]">
                  <div className="text-xs font-black uppercase">User Identity</div>
                  <div className="text-xl font-black">{user.name}</div>
                </div>
                <div className="border-2 border-black p-4 bg-cyan-400 shadow-[4px_4px_0px_0px_#000]">
                  <div className="text-xs font-black uppercase">Active Sessions</div>
                  <div className="text-xl font-black">{rooms.length}</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
