"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { motion, AnimatePresence } from "framer-motion";
import { X, History, User, Activity } from "lucide-react";

interface LogEntry {
  user: string;
  action: "CREATED" | "UPDATED" | "DELETED";
  shapeType: string;
  timestamp: number;
}

export function EventLogPanel({ 
  doc, 
  isOpen, 
  onClose 
}: { 
  doc: Y.Doc; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const roomLogs = doc.getArray<LogEntry>("room-logs");
    
    const updateLogs = () => {
      // Show latest first
      const allLogs = roomLogs.toArray().slice().reverse();
      setLogs(allLogs);
    };

    roomLogs.observe(updateLogs);
    updateLogs();

    return () => roomLogs.unobserve(updateLogs);
  }, [doc]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed right-6 top-24 z-[999999] w-80 max-h-[70vh] bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 bg-black text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="font-display font-black text-xs uppercase tracking-widest italic">EVENT // LOG</span>
            </div>
            <button onClick={onClose} className="hover:text-neutral-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Log List */}
          <div className="flex-1 overflow-y-auto p-2 bg-[#f0f0f0] flex flex-col gap-2">
            {logs.length === 0 ? (
              <div className="p-8 text-center opacity-30 italic flex flex-col items-center gap-2">
                <Activity className="w-8 h-8" />
                <span className="text-xs font-bold uppercase">No records found</span>
              </div>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000] flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-black text-[10px] uppercase truncate max-w-[120px]">
                        {log.user}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold opacity-50">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-black ${
                      log.action === 'CREATED' ? 'bg-green-400' :
                      log.action === 'DELETED' ? 'bg-red-400' :
                      'bg-blue-400'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-[11px] font-bold lowercase italic opacity-80">
                      {log.shapeType}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 bg-black text-[9px] text-white font-bold text-center uppercase opacity-50 tracking-tighter">
            End of records // {logs.length} entries
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
