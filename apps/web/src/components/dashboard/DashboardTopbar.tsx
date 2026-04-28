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
    <header className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between bg-[#F5F1E4]/70 backdrop-blur-md border-b border-black/5">
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
          className="w-10 h-10 flex items-center justify-center text-[#231F20] text-lg font-bold select-none"
          style={{
            backgroundColor: "#FFD702",
            transform: "rotate(-4deg)",
            borderRadius: 3,
            boxShadow:
              "2px 3px 8px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(0,0,0,0.05)",
            fontFamily: "var(--font-display)",
          }}
        >
          {initial}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm font-semibold text-[#6b6b6b] hover:text-[#231F20] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </header>
  );
}
