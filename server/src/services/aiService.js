async function getAiResponse({ message, history = [], userContext = {} }) {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return {
      reply: "AI key is not configured yet. Add OPENAI_API_KEY in server .env to enable full AI concierge responses.",
      provider: "fallback",
      reason: "missing_api_key",
    };
  }

  const compactHistory = Array.isArray(history)
    ? history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && String(m.text || "").trim())
        .slice(-8)
        .map((m) => ({ role: m.role, content: String(m.text).slice(0, 800) }))
    : [];

  const contextLine = `User context: loggedIn=${Boolean(userContext?.isLoggedIn)}, city=${userContext?.city || "unknown"}, country=${userContext?.country || "unknown"}.`;

  const payload = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are Horizon HMS AI concierge. Keep answers concise, friendly, and practical for hotel search, booking, payments, and cancellations. Prefer clear steps and short bullet points where useful.",
      },
      { role: "system", content: contextLine },
      ...compactHistory,
      { role: "user", content: String(message || "").slice(0, 2000) },
    ],
    temperature: 0.6,
    max_tokens: 320,
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[OPENAI_ERROR]", text);
      return {
        reply: "I am having trouble reaching the AI service right now. Please try again in a moment.",
        provider: "fallback",
        reason: "provider_error",
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return {
      reply: content || "I could not generate a response right now. Please try again.",
      provider: "openai",
      reason: null,
    };
  } catch (error) {
    console.error("[OPENAI_ERROR]", error?.message || error);
    return {
      reply: "I am temporarily unavailable. Please try again shortly.",
      provider: "fallback",
      reason: "network_error",
    };
  }
}

module.exports = {
  getAiResponse,
};
