"use client";

import { useEffect, useState, useMemo } from "react";
import { Editor, TLShape } from "tldraw"; 
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Target } from "lucide-react";

export default function TaskPanel({ editor }: { editor: Editor | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [allShapes, setAllShapes] = useState<TLShape[]>([]);

  // 1. Sync React state with the tldraw store
  useEffect(() => {
    if (!editor) return;

    const updateAllShapes = () => {
      // TRACK ALL SHAPES IN THE DOCUMENT (across all pages)
      const allRecords = (editor as any).store.allRecords();
      const shapes = allRecords.filter((r: any) => r.typeName === 'shape') as TLShape[];
      setAllShapes(shapes);
    };

    updateAllShapes();

    // Listen for any changes (add, update, delete)
    const cleanup = editor.store.listen(() => {
      updateAllShapes();
    }, { scope: 'document', source: 'all' });

    return () => cleanup();
  }, [editor]);

  // 2. Filter for shapes tagged as tasks in their meta
  const tasks = useMemo(() => {
    return allShapes.filter((s) => (s.meta as any)?.isTask === true);
  }, [allShapes]);

  const zoomToTask = (shapeId: any) => {
    const ed = editor as any; 
    if (!ed) return;
    
    const shape = ed.getShape(shapeId);
    if (!shape) return;

    // FIND PAGE ID: Traverse up the parent chain until we find a PageId
    let pageId = shape.parentId;
    while (pageId && !pageId.startsWith('page:')) {
      const parent = ed.getShape(pageId);
      if (!parent) break;
      pageId = parent.parentId;
    }

    if (pageId && pageId.startsWith('page:') && pageId !== ed.getCurrentPageId()) {
      ed.setCurrentPage(pageId);
    }
    
    const bounds = ed.getShapePageBounds(shapeId);
    if (bounds) {
      ed.zoomToBounds(bounds, { padding: 100, animation: { duration: 400 } });
    }
    ed.select(shapeId);
  };

  // 3. Extraction helper to navigate the 2026 richText schema
  const getTaskText = (task: TLShape) => {
    const props = task.props as any;
    
    // Path for modern tldraw v3/v4 richText (doc -> content -> paragraph -> content -> text)
    const richText = props.richText?.content?.[0]?.content?.[0]?.text;
    if (richText) return richText.replace(/.*\]\s*/, "");

    // Path for block-based richText
    const blocksText = props.richText?.blocks?.[0]?.content?.[0]?.text;
    if (blocksText) return blocksText.replace(/.*\]\s*/, "");

    // Path for basic text shapes
    const legacyText = props.text;
    if (legacyText) return legacyText.replace(/.*\]\s*/, "");

    return "Untitled Task";
  };

  return (
    <div className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-[999999] flex flex-col items-start pointer-events-none">
       {/* THE TRIGGER BUTTON */}
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="pointer-events-auto w-12 h-12 bg-black text-white border-2 border-white shadow-[4px_4px_0px_0px_#000] flex items-center justify-center hover:bg-neutral-800 transition-all mb-4"
       >
         <ClipboardList className="w-6 h-6" />
       </button>

       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ x: -100, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             exit={{ x: -100, opacity: 0 }}
             className="pointer-events-auto w-[calc(100vw-32px)] md:w-64 max-h-[60vh] bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] flex flex-col overflow-hidden"
           >
             <div className="p-3 bg-black text-white flex items-center justify-between">
                <span className="font-display font-black text-xs uppercase tracking-widest italic">TASK // BOARD</span>
                <span className="bg-white text-black px-1.5 py-0.5 text-[10px] font-black">{tasks.length}</span>
             </div>

             <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F0F0F0]">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 opacity-40 italic font-bold text-[10px] uppercase">
                    No active tasks.
                  </div>
                ) : (
                  tasks.map((task: TLShape) => (
                    <div 
                      key={task.id}
                      onClick={() => zoomToTask(task.id)}
                      className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_#000] cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
                    >
                       <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                             (task.meta as any)?.category === 'Action' ? 'bg-blue-500' : 
                             (task.meta as any)?.category === 'Research' ? 'bg-purple-500' : 'bg-yellow-500'
                          }`} />
                          <span className="text-[8px] font-black uppercase text-black/40 tracking-tight">
                             {(task.meta as any)?.category || "Action"}
                          </span>
                       </div>
                       <p className="text-[10px] font-bold leading-tight line-clamp-2">
                          {getTaskText(task)}
                       </p>
                       <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Target className="w-3 h-3 text-black" />
                       </div>
                    </div>
                  ))
                )}
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}