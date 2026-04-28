"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-client";

type DashboardTopbarProps = {
  userName: string;
};

export default function DashboardTopbar({ userName }: DashboardTopbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push("/");
    }
  };

  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between bg-white/40 backdrop-blur-lg border-b-2 border-neutral-900">
      <Link
        href="/dashboard"
        className="text-2xl font-extrabold tracking-tight text-[#231F20]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        LIGMA
      </Link>

      <div className="flex items-center gap-5">
        {/* Sticky-note avatar — small rotated yellow square with initial */}
        <div
          aria-label={userName}
          className="w-10 h-10 flex items-center justify-center bg-neutral-900 border-2 border-neutral-900 text-white text-lg font-bold select-none shadow-[3px_3px_0px_0px_#171717] rounded-full"
          style={{
            fontFamily: "var(--font-display)",
          }}
        >
          {initial}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="bg-accent-yellow hover:bg-accent-yellow-hover text-ink font-bold px-8 rounded-none border-2 border-neutral-900 shadow-[4px_4px_0px_0px_#171717] transition-all duration-120 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          style={{
            height: "48px",
          }}
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </header>
  );
}
