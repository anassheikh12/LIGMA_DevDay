"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StickyNote } from "../StickyNote";
import { generateDeterministicGrid } from "@/lib/grid";

const TASKS = [
  "Set up MongoDB", "Test Websockets", "Fix Git Submodules", "Deploy to Render", "Design UI",
  "Write API Docs", "Configure CORS", "Add Auth Flow", "Build Dashboard", "Refactor Store",
  "Setup CI/CD", "Review PRs", "Add Dark Mode", "Optimize Queries"
];

const COLORS = ["#FFD702", "#FFC107", "#FFB300", "#FF8C00", "#FFA500", "#FF7F50"];

interface NoteData {
  task: string;
  color: string;
  top: string;
  left: string;
  rotate: number;
  scale: number;
}

export default function StickyNoteBackground() {
  const [notes, setNotes] = useState<NoteData[]>([]);

  useEffect(() => {
    const grid = generateDeterministicGrid(88); // Different seed than landing
    
    const generatedNotes = grid.map((slot, i) => {
      return {
        task: TASKS[i % TASKS.length],
        color: COLORS[i % COLORS.length],
        top: `${slot.top}%`,
        left: `${slot.left}%`,
        rotate: slot.rotate,
        scale: slot.scale,
      };
    });

    setNotes(generatedNotes);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20" aria-hidden="true">
      {notes.map((n, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: n.scale }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 100, damping: 15 }}
          className="absolute origin-center"
          style={{
            top: n.top,
            left: n.left,
            width: "160px",
            height: "160px",
            rotate: n.rotate,
            zIndex: -1,
          }}
        >
          <StickyNote color={n.color}>
             <p className="font-display text-[10px] font-bold text-[#231F20] leading-snug mt-1">
              {n.task}
            </p>
          </StickyNote>
        </motion.div>
      ))}
    </div>
  );
}
