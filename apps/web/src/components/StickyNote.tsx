import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StickyNoteProps {
  children?: ReactNode;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

export function StickyNote({
  children,
  className,
  color = "#FFD702", // Default to Solid #FFD702
  style,
}: StickyNoteProps) {
  return (
    <div
      className={cn("relative group w-full h-full", className)}
      style={{ ...style, backgroundColor: "transparent" }}
    >
      {/* 
        The "Bottom Curl" Lift 
        Skewed and placed at the bottom right to make the paper look physically curved.
      */}
      <div
        className="absolute z-0"
        style={{
          bottom: "4px",
          right: "8px",
          width: "40%",
          height: "20%",
          transform: "skewY(6deg) rotateZ(4deg)",
          transformOrigin: "bottom right",
          // Drop shadow deeper at bottom-right
          boxShadow: "15px 25px 20px rgba(35, 31, 32, 0.3)",
          backgroundColor: "transparent",
        }}
      />
      
      {/* The opaque paper body */}
      <div
        className="relative z-10 w-full h-full flex flex-col p-6"
        style={{
          backgroundColor: color,
          // SVG noise background for matte texture
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
          // Very thin top edge shadow, thicker bottom right general shadow
          boxShadow: `inset 0 2px 2px -1px rgba(0, 0, 0, 0.15), 2px 2px 8px rgba(0,0,0,0.05)`,
        }}
      >
        {/* Content wrapper */}
        <div className="relative z-20 w-full h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
