"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateDeterministicGrid } from "@/lib/grid";

interface CursorIdentity {
  name: string;
  color: string;
  glow: string;
}

const CURSORS: CursorIdentity[] = [
  { name: "Anas", color: "#3B82F6", glow: "rgba(59,130,246,0.3)" },
  { name: "Hamza", color: "#22C55E", glow: "rgba(34,197,94,0.3)" },
  { name: "Hammad", color: "#EF4444", glow: "rgba(239,68,68,0.3)" },
  { name: "Tahir", color: "#A855F7", glow: "rgba(168,85,247,0.3)" },
];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function FloatingCursors() {
  const [positions, setPositions] = useState<{x: number, y: number}[]>([
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.9 },
    { x: 0.9, y: 0.9 },
  ]);
  const [visible, setVisible] = useState(false);

  // We only fetch grid slots once
  const gridSlots = useMemo(() => generateDeterministicGrid(42), []);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 800);

    let activeNotes = [0, 1, 2, 3]; // starting index into gridSlots for each cursor

    // Loop interval: move, then pause for 1s. We use a 3s interval (2s moving + 1s pausing).
    // Actually, framer motion spring handles the move seamlessly, so we just set new positions every 3s.
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      const scrollY = window.scrollY;
      const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(scrollY / docHeight, 1);

      setPositions((prev) =>
        prev.map((_, i) => {
          // Are we at the wall?
          if (progress > 0.6) {
             // Pick a random grid slot out of the 14 available
             // Prevent all 4 cursors from hitting the exact same note at once
             let nextNoteIndex = Math.floor(seededRandom(tick * 10 + i) * gridSlots.length);
             
             // Ensure it's not the same note it was just at
             if (nextNoteIndex === activeNotes[i]) {
                nextNoteIndex = (nextNoteIndex + 1) % gridSlots.length;
             }
             activeNotes[i] = nextNoteIndex;

             const targetSlot = gridSlots[nextNoteIndex];
             
             // Convert % to vw/vh logic. The grid is relative to the wall container,
             // which might be slightly offset from viewport, but mapping roughly 
             // to vw/vh inside the viewport looks great when scrolled down.
             // We map the slot's percentage to vw/vh so it looks like it's pointing to the notes.
             return { x: targetSlot.left / 100, y: targetSlot.top / 100 };
          } else {
             // When not at the wall, just float idly near edges
             const targetX = i % 2 === 0 ? 0.05 + seededRandom(tick + i) * 0.15 : 0.8 + seededRandom(tick + i) * 0.15;
             const targetY = 0.2 + seededRandom(tick * 20 + i) * 0.6;
             return { x: targetX, y: targetY };
          }
        })
      );
    }, 3000); // 3 seconds allows a long spring move + 1s reading pause

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, [gridSlots]);

  return (
    <AnimatePresence>
      {visible && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
          aria-hidden="true"
        >
          {CURSORS.map((cursor, i) => {
            const pos = positions[i];
            return (
              <motion.div
                key={cursor.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: `${pos.x * 100}vw`,
                  y: `${pos.y * 100}vh`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 40,
                  damping: 12,
                  mass: 1,
                }}
                className="absolute top-0 left-0"
              >
                {/* Cursor SVG */}
                <svg
                  width="20"
                  height="24"
                  viewBox="0 0 20 24"
                  fill="none"
                  style={{
                    filter: `drop-shadow(0 2px 8px ${cursor.glow})`,
                  }}
                >
                  <path
                    d="M2 1L18 12L10 13.5L7 22L2 1Z"
                    fill={cursor.color}
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Name Tag */}
                <div
                  className="mt-0.5 ml-3.5 px-2 py-0.5 rounded-md text-white text-[11px] font-semibold font-sans whitespace-nowrap tracking-wide"
                  style={{
                    backgroundColor: cursor.color,
                    boxShadow: `0 2px 12px ${cursor.glow}`,
                  }}
                >
                  {cursor.name}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
