"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

export default function JoinRoomCard() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    router.push(`/dashboard/${roomId.trim()}`);
  };

  return (
    <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0px_0px_#000] flex-1">
      <h2 className="font-display text-2xl font-black text-ink mb-2 uppercase italic tracking-tight">
        Sync to Room
      </h2>
      <p className="text-ink-muted text-[15px] mb-6">
        Enter a Room ID to collaborate
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="ENTER ROOM ID..."
          className="w-full bg-white border-2 border-black text-ink px-4 py-3 rounded-none text-[15px] font-bold focus:outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!roomId.trim()}
          className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-black py-3.5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
        >
          CONNECT //
        </button>
      </form>
    </div>
  );
}
