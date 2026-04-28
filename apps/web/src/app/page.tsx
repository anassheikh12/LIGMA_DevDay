"use client";

import dynamic from "next/dynamic";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PeelAwayStack from "@/components/PeelAwayStack";
import CollaborativeWall from "@/components/CollaborativeWall";

const FloatingCursors = dynamic(() => import("@/components/FloatingCursors"), {
  ssr: false,
});

export default function LandingPage() {
  return (
    <>
      <Header />
      <FloatingCursors />
      <main>
        <HeroSection />
        <PeelAwayStack />
        <CollaborativeWall />
      </main>
    </>
  );
}
