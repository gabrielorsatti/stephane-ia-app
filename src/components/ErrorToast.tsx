import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ToastMessage {
  id: number;
  text: string;
}

let nextId = 0;
const listeners: Set<(msg: ToastMessage) => void> = new Set();

export function showError(text: string) {
  const msg = { id: nextId++, text };
  listeners.forEach((fn) => fn(msg));
}

export function ErrorToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 w-[90%] max-w-sm">
      {messages.map((m) => (
        <div
          key={m.id}
          className="bg-rose-500/90 text-white rounded-xl px-4 py-3 flex items-start gap-3 shadow-lg animate-fadeIn backdrop-blur-sm"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-sm flex-1">{m.text}</span>
          <button
            className="shrink-0 p-0.5 hover:bg-white/20 rounded"
            onClick={() => setMessages((prev) => prev.filter((msg) => msg.id !== m.id))}
            aria-label="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
