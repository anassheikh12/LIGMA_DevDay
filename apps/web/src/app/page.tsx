"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PeelAwayStack from "@/components/PeelAwayStack";
import CollaborativeWall from "@/components/CollaborativeWall";
import Overlays from "@/components/Overlays";
import AuthModal from "@/components/auth/AuthModal";

const FloatingCursors = dynamic(() => import("@/components/FloatingCursors"), {
  ssr: false,
});

export default function LandingPage() {
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <Header
        setActiveOverlay={setActiveOverlay}
        onAuthRequired={() => setShowAuthModal(true)}
      />
      <Overlays activeOverlay={activeOverlay} setActiveOverlay={setActiveOverlay} />
      <FloatingCursors />
      <main>
        <HeroSection />
        <PeelAwayStack />
        <CollaborativeWall />
      </main>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
