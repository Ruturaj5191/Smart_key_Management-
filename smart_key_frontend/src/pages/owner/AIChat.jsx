import { useState, useRef, useEffect } from "react";
import api from "../../api/client";

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const question = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: question }]);
    setLoading(true); setError("");
    try {
      const res = await api.post("/ai/chat", { question });
      const answer = res.data.data?.answer || "No response from AI.";
      setMessages(prev => [...prev, { role: "ai", text: answer }]);
    } catch (err) {
      const msg = err?.response?.data?.message || "AI request failed";
      setError(msg);
      setMessages(prev => [...prev, { role: "ai", text: `⚠️ Error: ${msg}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">🤖 AI Assistant</h2>
          <p className="mt-1 text-sm text-slate-500">Ask about your keys, visitors, parking bookings</p>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-sm text-slate-500">Ask me anything about your keys, visitors, or parking!</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Where is my key?", "Show my visitors today", "Any parking bookings?", "Which keys are issued?"].map(q => (
                  <button key={q} onClick={() => { setInput(q); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800 border border-slate-200"}`}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-500">
                <span className="animate-pulse">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-slate-100 px-6 py-4 flex gap-3">
          <input type="text" className="flex-1 h-10 rounded-xl border border-slate-200 px-4 text-sm" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your keys, visitors, parking…" disabled={loading} />
          <button type="submit" disabled={loading || !input.trim()} className="h-10 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{loading ? "…" : "Send"}</button>
        </form>
      </div>
    </div>
  );
}
