"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type UiMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "default-session";
    const existing = localStorage.getItem("chat_session_id");
    if (existing) return existing;

    const newId = crypto.randomUUID();
    localStorage.setItem("chat_session_id", newId);
    return newId;
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`http://localhost:3001/chat/${sessionId}`);
        const history = await res.json();

        const formatted = history
          .filter((m: UiMessage) => m.role === "user" || m.role === "assistant")
          .map((m: UiMessage) => ({
            role: m.role,
            content: m.content,
          }));

        setMessages(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    if (sessionId) loadHistory();
  }, [sessionId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function clearChat() {
    await fetch(`http://localhost:3001/chat/${sessionId}`, {
      method: "DELETE",
    });
    setMessages([]);
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
      <h1>Chatbot</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          minHeight: 400,
          padding: 16,
          marginBottom: 16,
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: 12,
                textAlign: msg.role === "user" ? "right" : "left",
              }}
            >
              <strong>{msg.role === "user" ? "You" : "Bot"}:</strong>{" "}
              {msg.content}
            </div>
          ))
        )}

        {loading && <p>Bot is typing...</p>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 12 }}
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
        <button type="button" onClick={clearChat}>
          Clear
        </button>
      </form>
    </div>
  );
}
