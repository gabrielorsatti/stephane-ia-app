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
  const model = import.meta.env.VITE_LLM_MODEL ?? "llama3.3:70b";
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
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1500,
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status} — ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Réponse LLM inattendue (champ content manquant).");
  }
  return content;
}
