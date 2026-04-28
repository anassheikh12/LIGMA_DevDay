"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PeelAwayStack from "@/components/PeelAwayStack";
import CollaborativeWall from "@/components/CollaborativeWall";
import Overlays from "@/components/Overlays";

const FloatingCursors = dynamic(() => import("@/components/FloatingCursors"), {
  ssr: false,
});

export default function LandingPage() {
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  return (
    <>
      <Header setActiveOverlay={setActiveOverlay} />
      <Overlays activeOverlay={activeOverlay} setActiveOverlay={setActiveOverlay} />
      <FloatingCursors />
      <main>
        <HeroSection />
        <PeelAwayStack />
        <CollaborativeWall />
      </main>
    </>
  );
}
