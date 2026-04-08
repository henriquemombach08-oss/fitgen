"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  userProfile?: { level: string; goals: string[] };
}

export default function PersonalChat({ userProfile }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou seu personal trainer virtual 💪 Pode me perguntar sobre treinos, técnicas, nutrição ou qualquer dúvida fitness!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, loading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage].slice(-20);

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          userProfile,
        }),
      });

      const data = await res.json();
      const reply = data.reply ?? "Desculpe, não consegui processar sua mensagem.";

      setMessages((prev) =>
        [...prev, { role: "assistant", content: reply }].slice(-20)
      );
    } catch {
      setMessages((prev) =>
        [
          ...prev,
          {
            role: "assistant",
            content: "Erro de conexão. Tente novamente.",
          },
        ].slice(-20)
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg shadow-orange-500/30 transition-all duration-200 active:scale-95"
        aria-label={open ? "Fechar chat" : "Abrir chat com personal"}
      >
        {open ? "✕" : "💬 Personal"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 h-96 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800 shrink-0">
            <p className="text-white font-bold text-sm">🏋️ Personal IA</p>
            <p className="text-gray-500 text-xs">Tire suas dúvidas</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <span
                  className={
                    msg.role === "user"
                      ? "bg-orange-500 text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm max-w-[85%] ml-auto"
                      : "bg-gray-800 text-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm max-w-[85%]"
                  }
                >
                  {msg.content}
                </span>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <span className="bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1 items-center">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-800 px-3 py-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo..."
              disabled={loading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
