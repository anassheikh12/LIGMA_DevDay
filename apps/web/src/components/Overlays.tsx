import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { StickyNote } from "./StickyNote";

interface OverlaysProps {
  activeOverlay: string | null;
  setActiveOverlay: (overlay: string | null) => void;
}

export default function Overlays({ activeOverlay, setActiveOverlay }: OverlaysProps) {
  return (
    <AnimatePresence>
      {activeOverlay && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[9000] bg-[#F5F1E4]/95 backdrop-blur-md overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={() => setActiveOverlay(null)}
            className="fixed top-8 right-8 z-50 flex items-center gap-2 px-6 py-2 bg-[#FFD702] border-2 border-[#231F20] rounded-full text-[#231F20] font-display font-bold shadow-[4px_4px_0px_#231F20] hover:shadow-[2px_2px_0px_#231F20] hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
          >
            <X size={20} strokeWidth={3} />
            CLOSE
          </button>

          <div className="min-h-full flex items-center justify-center p-8 md:p-16">
            {activeOverlay === "architecture" && <ArchitectureOverlay />}
            {activeOverlay === "about" && <AboutUsOverlay />}
            {activeOverlay === "docs" && <DocumentationOverlay />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Architecture Overlay ───────────────────────────────────────────────
function ArchitectureOverlay() {
  const nodes = [
    { id: "A", title: "The Client (React + Konva)", desc: "Sends operations via Yjs." },
    { id: "B", title: "The Relay (Socket.io)", desc: "Syncs CRDT updates between peers." },
    { id: "C", title: "The Brain (Gemini API)", desc: "Extracts tasks from canvas text using natural language processing." },
    { id: "D", title: "The Persistence (MongoDB)", desc: "Stores the final state for long-term project management." },
  ];

  return (
    <div className="max-w-4xl w-full flex flex-col items-center">
      <h2 className="text-4xl md:text-6xl font-display font-black text-[#231F20] mb-16 tracking-tight text-center">
        System Flow
      </h2>
      
      <div className="relative w-full max-w-2xl flex flex-col gap-16">
        {/* SVG Flow Lines Behind Notes */}
        <div className="absolute inset-0 pointer-events-none z-0 flex justify-center">
          <svg className="w-full h-full" style={{ overflow: "visible" }}>
            <motion.path
              d="M 50% 0 L 50% 100%"
              stroke="#231F20"
              strokeWidth="4"
              strokeDasharray="12 12"
              fill="none"
              animate={{ strokeDashoffset: [0, -48] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            />
          </svg>
        </div>

        {nodes.map((node, i) => (
          <div key={node.id} className={`relative z-10 w-[280px] ${i % 2 === 0 ? "self-start" : "self-end"}`}>
            {/* Horizontal connecting line to center */}
            <div className={`absolute top-1/2 -translate-y-1/2 w-[100px] h-1 border-t-4 border-dashed border-[#231F20] -z-10 ${i % 2 === 0 ? "-right-[100px]" : "-left-[100px]"}`} />
            
            <StickyNote color="#FFD702" className="h-auto">
              <div className="border-2 border-[#231F20] bg-white p-4 h-full transform transition-transform hover:-translate-y-1">
                <span className="inline-block px-2 py-1 bg-[#231F20] text-[#FFD702] font-mono text-xs font-bold mb-3">
                  NODE {node.id}
                </span>
                <h3 className="font-display text-xl font-bold text-[#231F20] mb-2 leading-tight">
                  {node.title}
                </h3>
                <p className="font-sans text-sm text-[#231F20]/80 leading-relaxed font-medium">
                  {node.desc}
                </p>
              </div>
            </StickyNote>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── About Us Overlay ───────────────────────────────────────────────────
function AboutUsOverlay() {
  const team = [
    { name: "Anas Sheikh", role: "Technical Lead & AI Engineering", desc: "Architected the CRDT Sync.", color: "#3B82F6" },
    { name: "Hamza", role: "Frontend Architect", desc: "Animation Specialist.", color: "#22C55E" },
    { name: "Hammad", role: "Backend Infrastructure", desc: "Database Architecture.", color: "#EF4444" },
    { name: "Tahir", role: "UI/UX", desc: "Product Strategy.", color: "#A855F7" },
  ];

  return (
    <div className="max-w-5xl w-full">
      <h2 className="text-4xl md:text-6xl font-display font-black text-[#231F20] mb-12 tracking-tight text-center">
        The Team
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {team.map((member) => (
          <motion.div
            key={member.name}
            whileHover={{ rotate: [0, -3, 3, -1, 1, 0], scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="group relative h-[250px]"
          >
            {/* Custom hover cursor tooltip simulation */}
            <div className="absolute opacity-0 group-hover:opacity-100 -top-8 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white rounded-full transition-opacity z-50 pointer-events-none" style={{ backgroundColor: member.color }}>
              {member.name}'s Note
            </div>

            <StickyNote color="#FFD702">
              <div className="border-2 border-[#231F20] bg-white h-full p-6 flex flex-col justify-center text-center">
                <h3 className="font-display text-2xl font-black text-[#231F20] mb-2 uppercase">
                  {member.name}
                </h3>
                <h4 className="font-mono text-sm font-bold text-[#FFD702] bg-[#231F20] inline-block px-3 py-1 mx-auto mb-4 border-2 border-[#231F20]">
                  {member.role}
                </h4>
                <p className="font-sans text-base text-[#231F20] font-medium">
                  {member.desc}
                </p>
              </div>
            </StickyNote>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Documentation Overlay ──────────────────────────────────────────────
function DocumentationOverlay() {
  const commands = [
    { title: "Extract Tasks", desc: "Convert natural language into actionable sticky notes." },
    { title: "Group Notes", desc: "AI clusters similar ideas into organized regions." },
    { title: "Summarize Board", desc: "Generate a quick recap of the entire canvas." },
  ];

  const shortcuts = [
    { key: "N", desc: "New Note" },
    { key: "Space", desc: "Pan Canvas" },
    { key: "V", desc: "Select Tool" },
  ];

  return (
    <div className="max-w-5xl w-full">
      <h2 className="text-4xl md:text-6xl font-display font-black text-[#231F20] mb-16 tracking-tight text-center">
        Quick-Start Guide
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Column 1 */}
        <div>
          <div className="inline-block bg-[#FFD702] border-2 border-[#231F20] px-4 py-2 mb-8 shadow-[4px_4px_0px_#231F20]">
            <h3 className="font-display text-2xl font-bold text-[#231F20]">AI Commands</h3>
          </div>
          <div className="flex flex-col gap-4">
            {commands.map((cmd) => (
              <div key={cmd.title} className="bg-white border-2 border-[#231F20] p-4 shadow-[4px_4px_0px_rgba(35,31,32,0.1)] hover:shadow-[4px_4px_0px_#231F20] transition-shadow">
                <h4 className="font-display text-lg font-bold text-[#231F20] mb-1">{cmd.title}</h4>
                <p className="font-sans text-sm font-medium text-[#231F20]/70">{cmd.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2 */}
        <div>
          <div className="inline-block bg-[#FFD702] border-2 border-[#231F20] px-4 py-2 mb-8 shadow-[4px_4px_0px_#231F20]">
            <h3 className="font-display text-2xl font-bold text-[#231F20]">Shortcuts</h3>
          </div>
          <div className="flex flex-col gap-4">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center gap-4 bg-white border-2 border-[#231F20] p-4 shadow-[4px_4px_0px_rgba(35,31,32,0.1)] hover:shadow-[4px_4px_0px_#231F20] transition-shadow">
                <div className="bg-[#231F20] text-[#FFD702] font-mono font-bold px-4 py-2 rounded-sm text-lg min-w-[60px] text-center">
                  {shortcut.key}
                </div>
                <p className="font-sans text-lg font-bold text-[#231F20]">{shortcut.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
