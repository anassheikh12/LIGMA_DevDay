"use client";

import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useYjsStore } from "./useYjsStore";

export default function LigmaCanvas({
  roomId,
  userName,
  onEditorMount,
}: {
  roomId: string;
  userName: string;
  onEditorMount?: (editor: Editor) => void;
}) {
  const store = useYjsStore({
    roomId,
    hostUrl: "ws://localhost:4000",
  });

  return (
    <div className="w-full h-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden relative">
      <Tldraw
        store={store}
        onMount={(editor) => {
          editor.user.updateUserPreferences({ name: userName });
          onEditorMount?.(editor);
        }}
      />
    </div>
  );
}
