// Petit client compatible OpenAI pour l'endpoint Llama 3.3 du Groupe GENES.
// Aucune dépendance — un simple fetch suffit (l'API expose /chat/completions).

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

// Effectue un appel /chat/completions et retourne le texte de la 1ère réponse.
// Lève une Error en cas d'échec HTTP ou de payload inattendu.
export async function chatCompletion(
  messages: ChatMessage[],
  opts: ChatCompletionOptions = {},
): Promise<string> {
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
  console.debug("[LLM] →", url, { model: cfg.model, msgCount: messages.length });
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
    console.error("[LLM] fetch failed", e);
    throw new Error(
      `Réseau/CORS/SSL : impossible de joindre ${url} (${e instanceof Error ? e.message : "?"}). Vérifie que tu es sur le réseau GENES et que le certificat est accepté par ton navigateur.`,
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[LLM] HTTP error", res.status, text);
    throw new Error(`LLM HTTP ${res.status} — ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  console.debug("[LLM] ←", json);
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(
      `Réponse LLM inattendue : ${JSON.stringify(json).slice(0, 200)}`,
    );
  }
  return content;
}

// Liste les modèles disponibles sur l'endpoint (utile pour debug 403/404 model not found).
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
