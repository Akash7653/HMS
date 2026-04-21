import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const quickPrompts = [
  "Suggest hotels in Goa",
  "Show budget hotels",
  "Best luxury stays",
  "Payment help",
];

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function extractCityFromPrompt(text) {
  const lower = normalize(text);
  const match = lower.match(/in\s+([a-z\s]+)$/i);
  if (!match) return "";
  return match[1].trim();
}

export default function AiChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [highlightLauncher, setHighlightLauncher] = useState(() => !sessionStorage.getItem("hms_ai_chat_opened_once"));
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("hms_ai_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed;
        }
      }
    } catch {
      // Ignore corrupted local chat cache.
    }

    return [
      {
        id: 1,
        role: "assistant",
        text: "Hi, I am your Horizon AI concierge. Ask me for hotel suggestions, pricing hints, booking help, or payment support.",
      },
    ];
  });

  const canSend = useMemo(() => normalize(input).length > 0 && !loading && !isStreaming, [input, loading, isStreaming]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("hms_ai_chat_seen");
    if (hasSeen) return;

    const timer = setTimeout(() => {
      setOpen(true);
      localStorage.setItem("hms_ai_chat_seen", "1");
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (highlightLauncher) {
      setHighlightLauncher(false);
      sessionStorage.setItem("hms_ai_chat_opened_once", "1");
    }
  }, [open, highlightLauncher]);

  useEffect(() => {
    localStorage.setItem("hms_ai_chat_messages", JSON.stringify(messages.slice(-30)));
  }, [messages]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, isStreaming]);

  const pushMessage = (role, text) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role, text }]);
  };

  const streamAssistantReply = async (messageId, fullText) => {
    const parts = String(fullText || "").split(/(\s+)/).filter(Boolean);
    let composed = "";

    setIsStreaming(true);

    for (const part of parts) {
      composed += part;
      setMessages((prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, text: composed } : item))
      );

      // Tiny delays mimic token-like output without blocking the UI thread heavily.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, part.trim() ? 18 : 10));
    }

    setIsStreaming(false);
  };

  const handleSmartResponse = async (text) => {
    const lower = normalize(text);

    if (lower.includes("payment") || lower.includes("razorpay")) {
      return "To pay securely: open a hotel, choose dates, and continue to checkout. Confirm Booking will open the Razorpay popup before confirmation.";
    }

    if (lower.includes("cancel")) {
      return "You can cancel from My Bookings. Refund entries appear in Payment History automatically.";
    }

    const city = extractCityFromPrompt(text);
    if (city) {
      try {
        const res = await api.get("/hotels", { params: { city, page: 1 } });
        const hotels = res?.data?.data || [];
        if (!hotels.length) {
          return `I could not find hotels in ${city}. Try another city like Goa, Bengaluru, or Manali.`;
        }

        const top = hotels.slice(0, 3).map((h) => `${h.name} (${h.location?.city})`).join(", ");
        return `Here are top options in ${city}: ${top}. You can open Hotels page and filter by city for more.`;
      } catch {
        return "I could not fetch city-specific hotels right now, but you can use the Hotels filter to search by city instantly.";
      }
    }

    if (lower.includes("budget") || lower.includes("cheap") || lower.includes("affordable")) {
      return "For budget stays, open Hotels and sort/filter by min-max price. Single rooms usually start lower than Double or Suite.";
    }

    if (lower.includes("luxury") || lower.includes("premium")) {
      return "For luxury stays, look for Suite room types, premium amenities, and higher ratings on the Hotels page.";
    }

    if (lower.includes("book") || lower.includes("booking")) {
      return "Booking steps: choose hotel > pick room/date > review availability > continue to checkout > complete Razorpay checkout.";
    }

    return "I can help with hotel recommendations by city, booking flow, payments, and cancellations. Try: Suggest hotels in Goa.";
  };

  const sendMessage = async (raw) => {
    const outgoing = raw || input;
    const text = normalize(outgoing);
    if (!text || loading || isStreaming) return;

    const nextHistory = [...messages, { id: Date.now(), role: "user", text: outgoing }];
    pushMessage("user", outgoing);
    setInput("");
    setLoading(true);

    let finalResponse = "";

    try {
      const res = await api.post("/ai/chat", {
        message: outgoing,
        history: nextHistory.slice(-10).map((m) => ({ role: m.role, text: m.text })),
        context: {
          isLoggedIn: Boolean(user),
          city: user?.city || "",
          country: user?.country || "",
        },
      });

      const response = res?.data?.reply || "I could not generate a response right now.";
      const provider = res?.data?.provider || "fallback";

      if (provider === "openai") {
        finalResponse = response;
      } else {
        const fallback = await handleSmartResponse(text);
        finalResponse = `${response}\n\nQuick help: ${fallback}`;
      }
    } catch {
      const fallback = await handleSmartResponse(text);
      finalResponse = fallback;
    } finally {
      setLoading(false);
    }

    const assistantId = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: "" }]);
    await streamAssistantReply(assistantId, finalResponse);
  };

  return (
    <div className="safe-bottom-above-nav fixed left-3 right-3 z-50 sm:bottom-5 sm:left-5 sm:right-auto">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl shadow-cyan-500/15 backdrop-blur-xl sm:w-[90vw] dark:border-slate-700/50 dark:bg-slate-900/92"
          >
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-4 py-3 text-white">
              <p className="font-display text-lg font-bold">Horizon AI Concierge</p>
              <p className="text-xs text-white/90">Smart help for stays, bookings, and payments</p>
            </div>

            <div ref={scrollRef} className="max-h-[58vh] space-y-2 overflow-y-auto px-3 py-3 sm:max-h-80">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "assistant"
                      ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      : "ml-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  }`}
                >
                  {m.text}
                </div>
              ))}

              {loading || isStreaming ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
                  {loading ? "Thinking..." : "Typing..."}
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-700">
              <div className="mb-2 flex flex-wrap gap-2">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => sendMessage(p)}
                    className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-900/60 dark:bg-slate-800 dark:text-cyan-300"
                  >
                    {p}
                  </button>
                ))}
                {messages.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const reset = [
                        {
                          id: Date.now(),
                          role: "assistant",
                          text: "Chat cleared. Ask me about hotels, booking, payments, or cancellation.",
                        },
                      ];
                      setMessages(reset);
                      localStorage.setItem("hms_ai_chat_messages", JSON.stringify(reset));
                    }}
                    className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-slate-800 dark:text-rose-300"
                  >
                    Clear chat
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder="Ask for recommendations..."
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="button"
                  disabled={!canSend}
                  onClick={() => sendMessage()}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        animate={highlightLauncher && !open ? { y: [0, -4, 0], boxShadow: ["0 14px 24px rgba(6, 182, 212, 0.3)", "0 22px 40px rgba(37, 99, 235, 0.4)", "0 14px 24px rgba(6, 182, 212, 0.3)"] } : { y: 0 }}
        transition={highlightLauncher && !open ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap-target relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-500/30"
      >
        {highlightLauncher && !open ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-900">
            AI
          </span>
        ) : null}
        {open ? "Close AI" : "AI Chat"}
      </motion.button>
    </div>
  );
}
