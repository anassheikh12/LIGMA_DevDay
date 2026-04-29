"use client";

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Crown, Edit3, MessageSquare, Plus, Sparkles, Loader2, AlertCircle, X 
} from "lucide-react";
import { Editor, createShapeId, TLShapePartial } from "tldraw";

interface Message {
  sender: string;
  text: string;
  role: string;
  timestamp: number;
}

interface LigmaHubProps {
  doc: Y.Doc;
  awareness: any;
  user: { userId: string; name: string };
  currentRole: string;
  editor: Editor | null;
}

export default function LigmaHub({ doc, awareness, user, currentRole, editor }: LigmaHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"CHAT" | "AI">("CHAT");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatArray = doc.getArray<Message>("ligma-chat-v1");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const updateMessages = () => {
      setMessages(chatArray.toArray());
      if (!isOpen || activeTab !== "CHAT") setHasNewMessages(true);
    };
    chatArray.observe(updateMessages);
    setMessages(chatArray.toArray());
    return () => chatArray.unobserve(updateMessages);
  }, [chatArray, isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === "CHAT") {
      setHasNewMessages(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeTab]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    if (chatInput.startsWith("/promote ") && currentRole === "LEAD") {
      const targetName = chatInput.replace("/promote @", "").replace("/promote ", "").trim();
      promoteUser(targetName);
      setChatInput("");
      return;
    }

    const newMessage: Message = {
      sender: user.name,
      text: chatInput,
      role: currentRole,
      timestamp: Date.now(),
    };

    chatArray.push([newMessage]);
    setChatInput("");
  };

  const promoteUser = (name: string) => {
    // FIX: Safely iterate through awareness states
    const states = Array.from(awareness.getStates().entries());
    const found = states.find(([_, state]: any) => state.user?.name === name);

    if (found) {
      const systemMsg: Message = {
        sender: "SYSTEM",
        text: `@${name} HAS BEEN PROMOTED TO AUTHOR.`,
        role: "SYSTEM",
        timestamp: Date.now(),
      };
      chatArray.push([systemMsg]);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() || !editor || aiLoading) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gemini is busy");

      // 1. DEDUPLICATION: Remove previous AI results
      const oldAiShapes = editor.getCurrentPageShapes()
        .filter((s: any) => s.meta?.isAiGenerated === true)
        .map((s: any) => s.id);
      if (oldAiShapes.length > 0) editor.deleteShapes(oldAiShapes);

      const newShapes: any[] = [];
      const { ideas } = data;
      const center = editor.getViewportPageBounds().center;
      
      const categoryConfig: Record<string, { defaultColor: any; icon: string }> = {
        Action: { defaultColor: "blue", icon: "⚡ [ACTION]" },
        Research: { defaultColor: "violet", icon: "🔍 [RESEARCH]" },
        Design: { defaultColor: "yellow", icon: "🎨 [DESIGN]" },
      };

      for (const [index, ideaObj] of (ideas as any[]).entries()) {
        const textStr = (typeof ideaObj === 'string' ? ideaObj : ideaObj.text) || 'New Task';
        const category = ideaObj.category || "Action";
        const config = categoryConfig[category] || categoryConfig.Action;
        const pageName = `Breakout: ${category}`;
        
        let targetPageId = (editor.getPages().find(p => p.name === pageName) as any)?.id;
        if (!targetPageId) {
          targetPageId = (editor.createPage({ name: pageName }) as any).id;
        }

        const contentText = `${config.icon} ${textStr}`;
        console.log('Creating shape with text:', contentText);

        const newShape = {
          id: createShapeId(),
          type: 'note',
          x: center.x + (index - 2) * 220,
          y: center.y,
          props: {
            richText: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: contentText
                    }
                  ]
                }
              ]
            },
            color: config.defaultColor as any,
            size: 'm',
            font: 'draw',
            align: 'middle',
            verticalAlign: 'middle',
            growY: 0
          },
          meta: {
            isTask: true,
            isAiGenerated: true,
            category: category,
            creatorRole: 'lead'
          }
        };

        newShapes.push(newShape);
        editor.createShapes([newShape as any]);

        const isLead = currentRole?.toLowerCase() === 'lead';
        (editor as any).updateShapes([{ id: newShape.id, isLocked: !isLead }]);

        (editor as any).moveShapesToPage([newShape.id], targetPageId);
      }

      // 2. VISUAL FOCUS: Zoom to the new Battle Plan
      const newShapeIds = newShapes.map(s => s.id);
      if (newShapeIds.length > 0) {
        const firstShapeId = newShapeIds[0];
        const bounds = (editor as any).getShapePageBounds(firstShapeId);
        if (bounds) {
          (editor as any).zoomToBounds(bounds, { padding: 100, animation: { duration: 400 } });
        }
      }

      setAiPrompt("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "LEAD") return <Crown className="w-3 h-3 text-yellow-500" />;
    if (role === "AUTHOR") return <Edit3 className="w-3 h-3 text-cyan-500" />;
    return null;
  };

  // Rest of your JSX (Return block) remains the same
  return (
    <div className="fixed bottom-6 right-6 z-[999999] flex flex-col items-end gap-4 pointer-events-none">
      {/* HUB WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 h-[400px] bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] flex flex-col overflow-hidden pointer-events-auto mb-2"
          >
            {/* Header */}
            <div className="px-3 py-1 bg-black flex justify-between items-center">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                HUB {"//"} v1.0
              </span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>

            {/* TABS */}
            <div className="flex border-b-2 border-black">
              <button
                onClick={() => setActiveTab("CHAT")}
                className={`flex-1 py-2 font-display font-black text-[10px] tracking-widest transition-colors ${
                  activeTab === "CHAT" ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
                }`}
              >
                [CHAT]
              </button>
              <div className="w-[2px] bg-black" />
              <button
                onClick={() => setActiveTab("AI")}
                className={`flex-1 py-2 font-display font-black text-[10px] tracking-widest transition-colors ${
                  activeTab === "AI" ? "bg-yellow-400" : "bg-white hover:bg-neutral-100"
                }`}
              >
                [AI]
              </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#F0F0F0]">
              {activeTab === "CHAT" ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.sender === user.name ? "items-end" : "items-start"}`}>
                        {msg.role === "SYSTEM" ? (
                          <div className="w-full text-center py-2">
                            <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-1 border border-white">
                              {msg.text}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 mb-1">
                              {getRoleIcon(msg.role)}
                              <span className="text-[9px] font-black uppercase text-black/50">
                                {msg.sender}
                              </span>
                            </div>
                            <div className={`px-3 py-2 text-xs font-bold border-2 border-black max-w-[90%] break-words shadow-[2px_2px_0px_0px_#000] ${
                              msg.role === "LEAD" ? "bg-yellow-100" : "bg-white"
                            }`}>
                              {msg.text}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-3 bg-white border-t-4 border-black flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="TYPE MESSAGE..."
                      className="flex-1 bg-neutral-100 border-2 border-black p-2 text-[10px] font-black uppercase focus:outline-none focus:bg-white"
                    />
                    <button type="submit" className="bg-black text-white p-2 border-2 border-black hover:bg-yellow-400 hover:text-black transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 p-4 flex flex-col gap-3 bg-yellow-400/5">
                  {currentRole === "LEAD" ? (
                    <>
                      <div className="flex items-center gap-2 mb-0">
                        <div className="bg-black p-1.5">
                          <Sparkles className="text-white w-3 h-3" />
                        </div>
                        <h3 className="font-display text-base font-black uppercase italic tracking-tight">AI GEN</h3>
                      </div>
                      <p className="text-[8px] font-bold uppercase text-black/60 leading-tight">
                        Brainstorm ideas directly onto the canvas with Gemini Flash.
                      </p>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. 5 ideas for a SaaS..."
                        className="w-full h-20 bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none placeholder:text-neutral-400 resize-none"
                      />
                      {aiError && (
                        <div className="flex items-center gap-2 text-red-600 text-[8px] font-black uppercase italic">
                          <AlertCircle className="w-3 h-3" />
                          <span>{aiError}</span>
                        </div>
                      )}
                      <button
                        onClick={handleGenerateAI}
                        disabled={aiLoading || !aiPrompt.trim() || !editor}
                        className="w-full bg-black text-white font-black py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                      >
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>{aiLoading ? "GENERATING..." : <>LAUNCH {"//"}</>}</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-16 h-16 bg-neutral-200 border-4 border-black flex items-center justify-center">
                        <Crown className="w-8 h-8 text-neutral-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display text-lg font-black uppercase italic">LEAD ACCESS ONLY</h3>
                        <p className="text-[9px] font-bold uppercase text-black/40 px-8">
                          Only the room owner can trigger AI generation at this time.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all pointer-events-auto ${
          isOpen ? 'bg-black text-white' : 'bg-[#00FFFF] text-black hover:bg-[#00D1D1]'
        }`}
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
        {hasNewMessages && !isOpen && (
          <span className="absolute top-0 right-0 w-6 h-6 bg-red-500 border-4 border-black rounded-full animate-bounce" />
        )}
      </motion.button>
    </div>
  );
}