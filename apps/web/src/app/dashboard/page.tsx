"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, logout, type User } from "@/lib/auth-client";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import CreateRoomCard from "@/components/dashboard/CreateRoomCard";
import JoinRoomCard from "@/components/dashboard/JoinRoomCard";
import StickyNoteBackground from "@/components/dashboard/StickyNoteBackground";
import dynamic from "next/dynamic";
import Link from "next/link";
import { X } from "lucide-react";

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
  const [roomError, setRoomError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Strict session check
      const me = await getMe();
      if (cancelled) return;

      if (!me) {
        router.push("/");
        return;
      }

      setUser(me);

      // Fetch rooms with graceful handling
      try {
        const res = await fetch("/api/rooms/list");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
          setRoomError(false);
        } else {
          setRoomError(true);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
        setRoomError(true);
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
        <div className="font-display text-2xl font-black animate-pulse uppercase tracking-tighter">
          Authenticating Ligma...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 bg-dot-grid relative flex flex-col">
      <StickyNoteBackground />
      <FloatingCursors zIndex="z-0" />
      <DashboardTopbar userName={user.name} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
        
        {/* Sidebar (25%) */}
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative top-0 left-0 h-full z-50 md:z-auto w-[85%] md:w-1/4 border-r-4 border-black bg-white/95 md:bg-white/40 backdrop-blur-md p-6 md:p-8 transition-transform duration-300 ease-in-out overflow-y-auto`}>
          <div className="md:sticky md:top-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-black text-ink uppercase italic tracking-tight">
                Recent Rooms
              </h2>
              <button className="md:hidden p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-white border-2 border-black p-4 shadow-[6px_6px_0px_0px_#000] min-h-[400px]">
              <div className="space-y-4">
                {roomError ? (
                  <p className="text-danger text-xs font-bold uppercase italic">
                    Error loading rooms.
                  </p>
                ) : rooms.length === 0 ? (
                  <p className="text-ink-muted text-xs font-bold uppercase italic leading-relaxed">
                    No rooms found. <br/> Create your first session above!
                  </p>
                ) : (
                  rooms.map((room) => (
                    <Link
                      key={room.roomId}
                      href={`/dashboard/${room.roomId}`}
                      className="block bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
                    >
                      <div className="font-display font-black text-ink group-hover:text-ink-muted truncate">
                        {room.title}
                      </div>
                      <div className="text-[9px] text-ink-subtle uppercase font-bold mt-1">
                        ID: {room.roomId}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Stage (75%) */}
        <main className="w-full md:w-3/4 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-2xl md:text-4xl font-black text-ink mb-2 uppercase italic tracking-tighter">
              Welcome back, {user.name}
            </h1>
            <p className="font-display text-4xl md:text-7xl font-black text-ink mb-8 md:mb-12 uppercase italic tracking-tighter leading-[0.85]">
              Control Center
            </p>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <CreateRoomCard />
              <JoinRoomCard />
            </div>

            <div className="mt-12 md:mt-16 bg-white border-4 border-black p-6 md:p-12 shadow-[6px_6px_0px_0px_#000] md:shadow-[10px_10px_0px_0px_#000]">
              <h2 className="font-display text-xl md:text-3xl font-black text-ink mb-6 uppercase italic">
                System Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="border-2 border-black p-6 bg-lime-400 shadow-[6px_6px_0px_0px_#000]">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1">User Identity</div>
                  <div className="text-2xl font-black italic">{user.name}</div>
                </div>
                <div className="border-2 border-black p-6 bg-cyan-400 shadow-[6px_6px_0px_0px_#000]">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1">Active Sessions</div>
                  <div className="text-2xl font-black italic">{rooms.length}</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
