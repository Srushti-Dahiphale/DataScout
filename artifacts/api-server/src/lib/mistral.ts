const API_KEY = process.env.MISTRAL_API_KEY;

export function mistralEnabled() {
  return Boolean(API_KEY);
}

export async function analyzeWithMistral(prompt: string): Promise<Record<string, unknown> | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || "mistral-small-latest",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              'You are a research-request parser. Reply with ONLY a JSON object: {"intent": string, "entity": string, "geography": string, "limit": number, "confidence": number between 0 and 1, "filters": string[], "sources": string[]}.',
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function analyzeWithPollinations(prompt: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              'You are a research-request parser. Reply with ONLY a JSON object: {"intent": string, "entity": string, "geography": string, "limit": number, "confidence": number between 0 and 1, "filters": string[], "sources": string[]}.',
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function analyzeWithLLM(prompt: string): Promise<Record<string, unknown> | null> {
  return (await analyzeWithMistral(prompt)) ?? (await analyzeWithGemini(prompt)) ?? (await analyzeWithPollinations(prompt));
}

async function callChat(url: string, headers: Record<string, string>, body: Record<string, unknown>): Promise<string | null> {
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
      if (res.status === 503 && i === 0) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      if (!res.ok) return null;
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function analyzeWithGemini(prompt: string): Promise<Record<string, unknown> | null> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;
  const text = await callChat(
    "https://generativelanguage.googleapis.com/v1beta/chat/completions",
    { Authorization: `Bearer ${key}` },
    { model: process.env.GEMINI_MODEL || "gemini-3.8-flash", temperature: 0.2, messages: [{ role: "system", content: SYS_PROMPT }, { role: "user", content: prompt }] },
  );
  const match = text?.match(/\{[\s\S]*\}/);
  return match ? (JSON.parse(match[0]) as Record<string, unknown>) : null;
}

const SYS_PROMPT = 'You are a research-request parser. Reply with ONLY a JSON object: {"intent": string, "entity": string, "geography": string, "limit": number, "confidence": number between 0 and 1, "filters": string[], "sources": string[]}.';
