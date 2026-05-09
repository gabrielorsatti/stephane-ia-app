export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ChatCompletionResult {
  content: string;
  usage: TokenUsage;
}

// ~1 token ≈ 4 characters (conservative estimate for non-English text).
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function getLLMConfig(): LLMConfig | null {
  const apiKey = import.meta.env.VITE_LLM_API_KEY;
  const baseUrl =
    import.meta.env.VITE_LLM_BASE_URL ?? "https://llm.lab.groupe-genes.fr/openai";
  const model =
    import.meta.env.VITE_LLM_MODEL ??
    "meta-llama/Llama-3.3-70B-Instruct";
  if (!apiKey) return null;
  return { apiKey, baseUrl, model };
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export async function chatCompletion(
  messages: ChatMessage[],
  opts: ChatCompletionOptions = {},
): Promise<string> {
  const result = await chatCompletionWithUsage(messages, opts);
  return result.content;
}

export async function chatCompletionWithUsage(
  messages: ChatMessage[],
  opts: ChatCompletionOptions = {},
): Promise<ChatCompletionResult> {
  const cfg = getLLMConfig();
  if (!cfg) {
    throw new Error(
      "LLM non configuré : ajoute VITE_LLM_API_KEY dans .env (cf .env.example).",
    );
  }
  const url = `${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const payload = {
    model: cfg.model,
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 1500,
  };
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: opts.signal,
    });
  } catch (e) {
    throw new Error(
      `Réseau/CORS/SSL : impossible de joindre ${url} (${e instanceof Error ? e.message : "?"}).`,
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const keyHint = cfg.apiKey ? cfg.apiKey.slice(0, 8) + "…" : "MISSING";
    throw new Error(`LLM HTTP ${res.status} [key=${keyHint}] — ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(
      `Réponse LLM inattendue : ${JSON.stringify(json).slice(0, 200)}`,
    );
  }

  const apiUsage = json?.usage;
  const inputTokens = apiUsage?.prompt_tokens
    ?? estimateTokens(messages.map((m) => m.content).join(""));
  const outputTokens = apiUsage?.completion_tokens
    ?? estimateTokens(content);

  return {
    content,
    usage: { inputTokens, outputTokens, model: cfg.model },
  };
}

export async function listModels(): Promise<string[]> {
  const cfg = getLLMConfig();
  if (!cfg) throw new Error("LLM non configuré.");
  const url = `${cfg.baseUrl.replace(/\/$/, "")}/models`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []).map((m: { id: string }) => m.id);
}
