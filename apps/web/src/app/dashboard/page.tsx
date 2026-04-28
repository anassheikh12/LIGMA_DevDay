"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, type User } from "@/lib/auth-client";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import CreateRoomCard from "@/components/dashboard/CreateRoomCard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

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
      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !user) {
    return null;
  }

  const firstName = user.name.split(" ")[0] || user.name;

  return (
    <div className="min-h-screen bg-surface-0">
      <DashboardTopbar userName={user.name} />

      <main className="max-w-4xl mx-auto p-12">
        <h1 className="font-display text-4xl font-bold text-ink leading-[1.0] mb-8">
          Welcome back, {firstName}
        </h1>

        <CreateRoomCard />

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-ink mb-4">
            Your recent rooms
          </h2>
          <p className="text-ink-muted text-[15px]">No rooms yet</p>
        </section>
      </main>
    </div>
  );
}
