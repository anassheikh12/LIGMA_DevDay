"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const USE_MOCK_API = true;

interface HeaderProps {
  setActiveOverlay: (overlay: string | null) => void;
  onAuthRequired: () => void;
}

export default function Header({ setActiveOverlay, onAuthRequired }: HeaderProps) {
  const router = useRouter();

  const handleLaunch = async () => {
    if (USE_MOCK_API) {
      onAuthRequired();
      return;
    }

    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        router.push("/dashboard");
      } else {
        onAuthRequired();
      }
    } catch {
      onAuthRequired();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#F5F1E4]/70 backdrop-blur-md border-b border-black/5">
      {/* Logo */}
      <div className="flex items-center">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-[#231F20]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          LIGMA
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-8">
        {[
          { name: "Documentation", id: "docs" },
          { name: "Architecture", id: "architecture" },
          { name: "About Us", id: "about" },
        ].map((link) => (
          <button
            key={link.name}
            onClick={() => setActiveOverlay(link.id)}
            className="text-sm font-semibold text-[#6b6b6b] hover:text-[#231F20] transition-colors cursor-pointer"
          >
            {link.name}
          </button>
        ))}
      </nav>

      {/* Action */}
      <div className="flex items-center">
        <button
          onClick={handleLaunch}
          className="bg-[#FFD702] hover:bg-[#e6c200] text-[#231F20] px-6 py-2.5 rounded-full text-sm font-bold shadow-[0_4px_14px_rgba(255,215,2,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(255,215,2,0.5)] hover:-translate-y-0.5"
        >
          Launch App
        </button>
      </div>
    </header>
  );
}
