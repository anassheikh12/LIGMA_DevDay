"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { StickyNote } from "./StickyNote";
import { generateDeterministicGrid } from "@/lib/grid";

const TASKS = [
  "Set up MongoDB", "Test Websockets", "Fix Git Submodules", "Deploy to Render", "Design UI",
  "Write API Docs", "Configure CORS", "Add Auth Flow", "Build Dashboard", "Refactor Store",
  "Setup CI/CD", "Review PRs", "Add Dark Mode", "Optimize Queries"
];

// Palette of bright yellow and orange shades
const COLORS = ["#FFD702", "#FFC107", "#FFB300", "#FF8C00", "#FFA500", "#FF7F50"];

interface NoteData {
  task: string;
  color: string;
  top: string;
  left: string;
  rotate: number;
  scale: number;
  delay: number;
}

export default function CollaborativeWall() {
  const [notes, setNotes] = useState<NoteData[]>([]);

  useEffect(() => {
    // Generate data only on the client to prevent hydration mismatch
    const grid = generateDeterministicGrid(42);
    
    const generatedNotes = grid.map((slot, i) => {
      return {
        task: TASKS[i % TASKS.length],
        color: COLORS[i % COLORS.length],
        top: `${Math.max(5, Math.min(80, slot.top))}%`,
        left: `${Math.max(5, Math.min(80, slot.left))}%`,
        rotate: slot.rotate,
        scale: slot.scale,
        delay: i * 0.02,
      };
    });

    setNotes(generatedNotes);
  }, []);

  return (
    <section id="wall" className="relative min-h-[120vh] py-24 px-8 flex flex-col items-center overflow-hidden">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-[clamp(0.7rem,1.5vw,0.85rem)] font-semibold uppercase tracking-[0.15em] text-[#231F20]/25 font-sans mb-8 z-20"
      >
        The Result
      </motion.p>

      {/* Organic Wall Container */}
      <div className="relative w-full max-w-6xl h-[800px] mt-8 mb-16">
        {notes.length === 0 ? (
          // Placeholder to satisfy hydration without causing a mismatch
          <div className="absolute inset-0" />
        ) : (
          notes.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: n.scale }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ delay: n.delay, type: "spring", stiffness: 200, damping: 20 }}
              whileHover={{
                scale: n.scale * 1.1,
                zIndex: 50,
                transition: { duration: 0.2 },
              }}
              className="absolute origin-center"
              style={{
                top: n.top,
                left: n.left,
                width: "180px",
                height: "180px",
                rotate: n.rotate,
                zIndex: 10 + i, // Simple stacking order
              }}
            >
              <StickyNote color={n.color} className="cursor-pointer">
                {/* Pin dot */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#231F20]/20 shadow-[0_1px_1px_rgba(255,255,255,0.5)]" />
                <p className="font-display text-sm font-bold text-[#231F20] leading-snug mt-2">
                  {n.task}
                </p>
                {/* Check mark */}
                <span className="absolute bottom-2 right-3 text-sm font-bold opacity-40">✓</span>
              </StickyNote>
            </motion.div>
          ))
        )}
      </div>

      {/* Enter Workspace CTA (Highest Z-Index) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="relative z-[999] mt-auto"
      >
        <Link href="/canvas" className="no-underline">
         
        </Link>
      </motion.div>
    </section>
  );
}
