"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "2rem",
      }}
    >
      {/* Subtle grid pattern background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(35,31,32,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(35,31,32,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Small scattered sticky notes in background */}
      {[
        { x: "8%", y: "15%", rot: -12, color: "#FFE066", size: 60, opacity: 0.3 },
        { x: "85%", y: "20%", rot: 8, color: "#FFD702", size: 50, opacity: 0.25 },
        { x: "12%", y: "75%", rot: 15, color: "#FFE066", size: 45, opacity: 0.2 },
        { x: "78%", y: "80%", rot: -6, color: "#FFD702", size: 55, opacity: 0.3 },
        { x: "50%", y: "8%", rot: 4, color: "#FFE066", size: 40, opacity: 0.15 },
        { x: "92%", y: "50%", rot: -18, color: "#FFD702", size: 48, opacity: 0.2 },
      ].map((note, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5, rotate: note.rot }}
          animate={{ opacity: note.opacity, scale: 1, rotate: note.rot }}
          transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
          style={{
            position: "absolute",
            left: note.x,
            top: note.y,
            width: note.size,
            height: note.size,
            backgroundColor: note.color,
            borderRadius: 3,
            boxShadow: "2px 3px 8px rgba(0,0,0,0.08)",
            transform: `rotate(${note.rot}deg)`,
          }}
        />
      ))}

      {/* The massive central sticky note */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -3 }}
        animate={{ scale: 1, opacity: 1, rotate: -1.5 }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 14,
          delay: 0.2,
        }}
        style={{
          position: "relative",
          zIndex: 2,
          width: "min(520px, 90vw)",
          padding: "3rem 2.5rem",
          backgroundColor: "#FFD702",
          borderRadius: 4,
          boxShadow: `
            0 20px 60px rgba(0,0,0,0.12),
            0 8px 20px rgba(0,0,0,0.08),
            inset 0 -2px 0 rgba(0,0,0,0.05)
          `,
          textAlign: "center",
        }}
      >
        {/* Tape strip at top */}
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%) rotate(1deg)",
            width: 80,
            height: 24,
            backgroundColor: "rgba(255,255,255,0.5)",
            borderRadius: 2,
            backdropFilter: "blur(4px)",
          }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.5rem, 10vw, 7rem)",
            fontWeight: 800,
            lineHeight: 1,
            color: "#231F20",
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          LIGMA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1rem, 3vw, 1.5rem)",
            fontWeight: 400,
            color: "rgba(35,31,32,0.7)",
            marginTop: "0.75rem",
            letterSpacing: "0.04em",
          }}
        >
          Ideate. Extract. Execute.
        </motion.p>

        {/* Subtle fold effect */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)",
            borderRadius: "0 0 4px 0",
          }}
        />
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(35,31,32,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
          }}
        >
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          style={{
            width: 20,
            height: 32,
            borderRadius: 10,
            border: "2px solid rgba(35,31,32,0.2)",
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
          }}
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            style={{
              width: 3,
              height: 8,
              borderRadius: 2,
              backgroundColor: "rgba(35,31,32,0.3)",
            }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
