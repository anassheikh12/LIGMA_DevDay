"use client";

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// ── Constants ────────────────────────────────────────────────────────────
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";
const ROOM = "ligma-spike";

type ConnStatus = "connecting" | "connected" | "disconnected";

export default function SpikePage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<ConnStatus>("connecting");

  useEffect(() => {
    // ── Yjs document + shared type ────────────────────────────────────
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("shared");

    // ── y-websocket provider ──────────────────────────────────────────
    const provider = new WebsocketProvider(WS_URL, ROOM, ydoc);

    provider.on("status", ({ status: s }: { status: string }) => {
      setStatus(s as ConnStatus);
    });

    // ── Bind Y.Text ↔ textarea ────────────────────────────────────────
    const textarea = textareaRef.current!;

    // Yjs → textarea
    const observer = () => {
      const ytextStr = ytext.toString();
      if (textarea.value !== ytextStr) {
        // Preserve cursor position across remote updates
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = ytextStr;
        textarea.setSelectionRange(start, end);
      }
    };
    ytext.observe(observer);

    // Set initial value
    textarea.value = ytext.toString();

    // textarea → Yjs
    const handleInput = () => {
      const newValue = textarea.value;
      const currentYText = ytext.toString();

      if (newValue === currentYText) return;

      // Compute a simple diff — replace entire content transactionally
      ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, newValue);
      });
    };

    textarea.addEventListener("input", handleInput);

    // ── Cleanup ───────────────────────────────────────────────────────
    return () => {
      textarea.removeEventListener("input", handleInput);
      ytext.unobserve(observer);
      provider.disconnect();
      ydoc.destroy();
    };
  }, []);

  const statusLabel =
    status === "connected"
      ? "Connected"
      : status === "connecting"
      ? "Connecting…"
      : "Disconnected";

  return (
    <main className="spike-container">
      {/* Header */}
      <header className="spike-header">
        <h1 className="spike-title">
          <span>LIGMA</span> Sync Spike
        </h1>
        <p className="spike-subtitle">
          Open this page in multiple browser windows. Everything you type syncs
          in real-time via Yjs CRDTs — no refresh required.
        </p>
      </header>

      {/* Editor Card */}
      <div className="editor-card">
        <div className="editor-toolbar">
          <span className="editor-toolbar-title">Shared Document</span>
          <span className={`status-badge ${status}`}>
            <span className="status-dot" />
            {statusLabel}
          </span>
        </div>

        <textarea
          ref={textareaRef}
          className="editor-textarea"
          placeholder="Start typing — it syncs everywhere…"
          id="shared-editor"
        />
      </div>

      {/* Footer Hint */}
      <p className="spike-footer">
        Backend running at <code>{WS_URL}</code> — room{" "}
        <code>{ROOM}</code>. Try opening{" "}
        <code>http://localhost:3000</code> in two tabs side by side.
      </p>
    </main>
  );
}
