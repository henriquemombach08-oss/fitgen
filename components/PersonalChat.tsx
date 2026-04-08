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
        [...prev, { role: "assistant" as const, content: reply }].slice(-20)
      );
    } catch {
      setMessages((prev) =>
        [
          ...prev,
          {
            role: "assistant" as const,
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
        className="fixed bottom-4 right-4 z-50 w-11 h-11 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95"
        style={{
          background: "#f97316",
          boxShadow: "0 4px 24px rgba(249,115,22,0.25)",
        }}
        aria-label={open ? "Fechar chat" : "Abrir chat com personal"}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 h-[420px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "#0f0f0f",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 shrink-0 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: "#fafafa" }}>
                Personal IA
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#22c55e" }}
                />
                <p className="text-xs" style={{ color: "#52525b" }}>
                  Online
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 p-3 space-y-2"
            style={{ overflowY: "auto", scrollbarWidth: "none" }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <span
                  className="rounded-2xl px-3 py-2 text-sm max-w-[85%] leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          background: "#f97316",
                          color: "white",
                          borderBottomRightRadius: "4px",
                        }
                      : {
                          background: "#141414",
                          color: "#fafafa",
                          borderBottomLeftRadius: "4px",
                        }
                  }
                >
                  {msg.content}
                </span>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <span
                  className="rounded-2xl px-3 py-2.5 flex gap-1 items-center"
                  style={{
                    background: "#141414",
                    borderBottomLeftRadius: "4px",
                  }}
                >
                  <span
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: "#52525b", animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: "#52525b", animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: "#52525b", animationDelay: "300ms" }}
                  />
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className="px-3 py-3 flex gap-2 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo..."
              disabled={loading}
              className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none disabled:opacity-50 transition-colors"
              style={{
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#fafafa",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(249,115,22,0.30)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.06)";
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-lg px-3 py-2 flex items-center justify-center disabled:opacity-40 transition-all active:scale-95 hover:opacity-90"
              style={{ background: "#f97316" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
