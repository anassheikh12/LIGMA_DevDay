"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

export default function CreateRoomCard() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!res.ok) throw new Error("Failed to create room");
      const room = await res.json();
      router.push(`/dashboard/${room.roomId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0px_0px_#000] flex-1">
      <h2 className="font-display text-2xl font-black text-ink mb-2 uppercase italic tracking-tight">
        Initiate Session
      </h2>
      <p className="text-ink-muted text-[15px] mb-6">
        Launch a new collaborative workspace
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="SESSION TITLE..."
          className="w-full bg-white border-2 border-black text-ink px-4 py-3 rounded-none text-[15px] font-bold focus:outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full bg-accent-yellow hover:bg-accent-yellow-hover text-ink font-black py-3.5 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
        >
          {loading ? "INITIALIZING..." : "LAUNCH //"}
        </button>
      </form>
    </div>
  );
}
