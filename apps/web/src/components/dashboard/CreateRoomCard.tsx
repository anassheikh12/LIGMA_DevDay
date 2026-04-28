"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

const USE_MOCK_API = true;

type CreateRoomResponse = { roomId: string };

async function createRoom(name: string): Promise<CreateRoomResponse> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 400));
    return { roomId: "demo-" + Math.random().toString(36).slice(2, 8) };
  }

  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) throw new Error("Failed to create room. Please try again.");
  return res.json();
}

export default function CreateRoomCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const { roomId } = await createRoom(name.trim());
      router.push(`/room/${roomId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create room. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-1 rounded-lg p-8">
      <h2 className="font-display text-2xl font-bold text-ink mb-2">
        Start a new room
      </h2>
      <p className="text-ink-muted text-[15px] mb-6">
        Create a fresh canvas for your team
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sprint Planning Oct 24"
          className="flex-1 bg-surface-1 border border-border text-ink px-4 py-3 rounded-md text-[15px] focus:outline-none focus:border-ink focus:border-2 placeholder:text-ink-subtle"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-accent-yellow hover:bg-accent-yellow-hover text-ink font-semibold px-6 rounded-pill transition-all duration-120 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>

      {error && <p className="text-danger text-sm mt-4">{error}</p>}
    </div>
  );
}
