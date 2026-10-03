const API_KEY = process.env.LANGSMITH_API_KEY;
const PROJECT = process.env.LANGSMITH_PROJECT || "DataScout-AI";
const BASE = process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com";

export function langsmithEnabled() {
  return Boolean(API_KEY);
}

let sessionId: string | null = null;

async function getSessionId(): Promise<string | null> {
  if (sessionId) return sessionId;
  try {
    const created = await fetch(`${BASE}/api/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY! },
      body: JSON.stringify({ name: PROJECT, description: "DataScout AI demo traces" }),
    });
    if (created.ok) {
      sessionId = ((await created.json()) as { id: string }).id;
      return sessionId;
    }
    const list = await fetch(`${BASE}/api/v1/sessions?name=${encodeURIComponent(PROJECT)}`, {
      headers: { "x-api-key": API_KEY! },
    });
    const sessions = (await list.json()) as Array<{ id: string }>;
    sessionId = sessions?.[0]?.id ?? null;
  } catch {
    sessionId = null;
  }
  return sessionId;
}

async function tracePatchBody(body: Record<string, unknown>) {
  const sid = await getSessionId();
  return sid ? { ...body, session_id: sid } : body;
}

async function post(path: string, body: unknown) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY! },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.warn("langsmith:", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.warn("langsmith error:", (err as Error).message);
  }
}

async function patch(path: string, body: unknown) {
  try {
    await fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY! },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("langsmith error:", (err as Error).message);
  }
}

export async function traceRun<T>(
  name: string,
  inputs: Record<string, unknown>,
  fn: () => T | Promise<T>,
): Promise<T> {
  if (!API_KEY) return fn();
  const id = crypto.randomUUID();
  const start = new Date();
  try {
    const result = await fn();
    await post("/runs", {
      id,
      name,
      run_type: "chain",
      inputs,
      outputs: typeof result === "object" ? result : { result },
      start_time: start.toISOString(),
      end_time: new Date().toISOString(),
      session_id: await getSessionId(),

    });
    return result;
  } catch (err) {
    await post("/runs", {
      id,
      name,
      run_type: "chain",
      inputs,
      error: (err as Error).message,
      start_time: start.toISOString(),
      end_time: new Date().toISOString(),
      session_id: await getSessionId(),

    });
    throw err;
  }
}
