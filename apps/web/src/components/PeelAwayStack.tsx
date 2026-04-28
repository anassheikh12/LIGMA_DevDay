"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { StickyNote } from "./StickyNote";
import { Zap, Cpu, Lock } from "lucide-react";

const NOTES = [
  {
    title: "Conflict-Free Sync",
    sub: "Powered by Yjs + CRDTs",
    bullets: ["Zero-latency multi-user editing", "Automatic offline-to-online merging"],
    color: "#FFD702",
    Icon: Zap,
  },
  {
    title: "Intent Extraction",
    sub: "Google Gemini Pro Integration",
    bullets: ["Natural language to task conversion", "Instant categorization & tagging"],
    color: "#FFC107",
    Icon: Cpu,
  },
  {
    title: "Granular Security",
    sub: "Node-Level RBAC",
    bullets: ["Secure shared workspace controls", "Full event-sourced change history"],
    color: "#FFB300",
    Icon: Lock,
  },
];

export default function PeelAwayStack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section ref={ref} id="process" className="relative h-[400vh]">
      <div className="sticky top-0 h-[100vh] flex flex-col items-center justify-center p-8 overflow-hidden">
        <p className="absolute top-24 text-[clamp(0.7rem,1.5vw,0.85rem)] font-semibold uppercase tracking-[0.15em] text-[#231F20]/25 font-sans">
          The Process
        </p>

        {/* Stack container - absolute overlapping items */}
        <div className="relative w-[min(420px,85vw)] h-[min(420px,85vw)]">
          {NOTES.map((note, i) => (
            <FastTearNote key={i} note={note} index={i} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FastTearNote({ note, index, progress }: {
  note: typeof NOTES[number]; index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  // Use a state for vw/vh so we don't have hydration mismatch on initial render
  const [dimensions, setDimensions] = useState({ vw: 1000, vh: 1000 });
  
  useEffect(() => {
    setDimensions({ vw: window.innerWidth, vh: window.innerHeight });
  }, []);

  // Determine exact input/output ranges based on index
  let input = [0, 1];
  let outputRotate = [0, 0];
  let outputX = [0, 0];
  let outputY = [0, 0];

  if (index === 0) {
    // Note 1 (Top-most)
    input = [0, 0.25];
    outputRotate = [0, -45];
    outputX = [0, -1.5 * dimensions.vw];
  } else if (index === 1) {
    // Note 2 (Middle)
    input = [0.35, 0.6];
    outputRotate = [0, 45];
    outputX = [0, 1.5 * dimensions.vw];
  } else if (index === 2) {
    // Note 3 (Bottom-most)
    input = [0.7, 0.95];
    outputRotate = [0, -15];
    outputY = [0, -1.2 * dimensions.vh];
  }

  const rawX = useTransform(progress, input, outputX);
  const rawY = useTransform(progress, input, outputY);
  const rawRotate = useTransform(progress, input, outputRotate);

  // Apply a high stiffness spring for high-velocity fast peel
  const x = useSpring(rawX, { stiffness: 600, damping: 50 });
  const y = useSpring(rawY, { stiffness: 600, damping: 50 });
  const rotateFly = useSpring(rawRotate, { stiffness: 600, damping: 50 });

  // Base rotation for the stacked look
  const baseRotate = index === 0 ? 2 : index === 1 ? -1 : 1;
  const rotate = useTransform(() => rotateFly.get() + baseRotate);

  const zIndex = 3 - index;

  return (
    <motion.div style={{ position: "absolute", inset: 0, x, y, rotate, zIndex }}>
      <StickyNote color={note.color}>
        {/* Top-right Icon */}
        <div className="absolute top-6 right-6 text-[#231F20]/40">
          <note.Icon size={28} strokeWidth={2.5} />
        </div>

        {/* Content Centered Vertically & Horizontally */}
        <div className="flex flex-col h-full items-center justify-center text-center gap-6 py-8 px-4">
          <div className="flex flex-col gap-2 items-center">
            <h3 className="font-display text-3xl font-bold text-[#231F20] leading-tight m-0">
              {note.title}
            </h3>
            <span className="font-mono text-[13px] font-bold text-[#231F20]/50 uppercase tracking-widest">
              {note.sub}
            </span>
          </div>

          <ul className="flex flex-col gap-4 text-left w-full max-w-[90%] mt-4">
            {note.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 font-sans text-[15px] font-medium text-[#231F20]/80 leading-snug">
                <span className="text-[#231F20]/30 mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </StickyNote>
    </motion.div>
  );
}
