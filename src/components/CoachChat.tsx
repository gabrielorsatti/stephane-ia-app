import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProgramTemplate } from "../data/programs";
import { buildCoachContext } from "../lib/coachContext";
import {
  chatCompletion,
  getLLMConfig,
  listModels,
  type ChatMessage,
} from "../lib/llm";
import {
  extractRecommendation,
  type ProgramRecommendation,
} from "../lib/recommendations";
import type {
  BodyWeightEntry,
  PersonalRecordOverride,
  Session,
} from "../types";
import { RecommendationModal } from "./RecommendationModal";

interface Props {
  sessions: Session[];
  bodyWeights: BodyWeightEntry[];
  overrides: PersonalRecordOverride[];
  programs: ProgramTemplate[];
  onApplyPrograms: (next: ProgramTemplate[]) => void;
}

const SYSTEM_PROMPT = `Tu es un coach de musculation expert et bienveillant. Tu réponds toujours en français, de manière concise et concrète.

Tu disposes du contexte de performance complet de l'utilisateur (séances, poids de corps, records, programmes) injecté ci-dessous. Appuie tes réponses sur ces données.

Quand l'utilisateur te pose des questions, utilise du **Markdown** : titres courts, listes à puces, **tableaux** pour comparer des charges/séries.

Quand on te demande explicitement de proposer une mise à jour de programme, réponds par :
1. Un court paragraphe d'analyse en Markdown.
2. PUIS un bloc \`\`\`json contenant un objet de la forme :
{
  "summary": "résumé en 1-2 phrases",
  "shortTerm": [
    {
      "programId": "push" | "pull" | "mixte" | ...,
      "exerciseName": "Nom exact tel qu'il apparaît dans le programme",
      "field": "sets" | "repsTarget" | "poidsTarget" | "objectif",
      "oldValue": "valeur actuelle",
      "newValue": "valeur proposée",
      "reason": "courte justification basée sur les données"
    }
  ],
  "longTermNote": "vision sur 2-3 mois (optionnel)"
}

Ne propose une modification QUE si les données la justifient (stagnation, objectif atteint, déséquilibre). Sois précis sur exerciseName : il doit matcher exactement le nom dans le programme.`;

const RECOMMENDATION_TRIGGER = `Analyse mes dernières séances et propose une mise à jour intelligente de mon programme pour la semaine à venir. Identifie : exercices en stagnation, objectifs atteints, déséquilibres entre catégories. Réponds avec ton analyse Markdown puis un bloc \`\`\`json conforme au format demandé. Sois conservateur : maximum 5 modifications.`;

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  recommendation?: ProgramRecommendation;
}

export function CoachChat({
  sessions,
  bodyWeights,
  overrides,
  programs,
  onApplyPrograms,
}: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRec, setActiveRec] = useState<ProgramRecommendation | null>(
    null,
  );
  const [availableModels, setAvailableModels] = useState<string[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const config = getLLMConfig();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(userText: string) {
    if (!userText.trim()) return;
    if (!config) {
      setError(
        "Coach IA non configuré : ajoute VITE_LLM_API_KEY dans .env puis redémarre `npm run dev` (les variables Vite ne sont lues qu'au démarrage).",
      );
      return;
    }
    setError(null);
    const next: DisplayMessage[] = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const context = buildCoachContext({
        sessions,
        bodyWeights,
        overrides,
        programs,
      });
      const llmMessages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Contexte utilisateur :\n\n${context}` },
        ...next.map((m) => ({
          role: m.role,
          content: m.content,
        })) as ChatMessage[],
      ];
      const reply = await chatCompletion(llmMessages, { temperature: 0.4 });
      const recommendation = extractRecommendation(reply) ?? undefined;
      setMessages([
        ...next,
        { role: "assistant", content: reply, recommendation },
      ]);
      if (recommendation) setActiveRec(recommendation);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading) void send(input);
  }

  function smartUpdate() {
    if (!loading) void send(RECOMMENDATION_TRIGGER);
  }

  async function fetchModels() {
    setError(null);
    try {
      const ids = await listModels();
      setAvailableModels(ids);
      console.log("[LLM] available models:", ids);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-semibold">Coach IA</h3>
            {config && (
              <span className="text-[10px] text-text-dim font-mono">
                {config.model}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              className="btn-ghost !py-1.5 text-xs"
              onClick={fetchModels}
              disabled={!config}
              title="Lister les modèles disponibles sur le serveur"
            >
              Modèles dispo
            </button>
            <button
              className="btn-primary !py-1.5 text-xs"
              onClick={smartUpdate}
              disabled={loading || !config}
              title="Analyse ton volume et ton intensité des 4 dernières semaines pour ajuster ton programme selon le principe de surcharge progressive (séries, reps, charges)."
            >
              <Sparkles className="w-4 h-4" /> Mise à jour intelligente
            </button>
          </div>
        </div>
        <div className="text-xs text-text-muted space-y-1.5">
          <p>
            Ton coach a accès à toutes tes données (séances, records,
            programmes) et peut :
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-text-muted/90">
            <li>analyser ta progression et détecter les stagnations,</li>
            <li>
              suggérer des charges / reps pour la prochaine séance,
            </li>
            <li>
              proposer des modifications de programme — tu valides avant
              application via le bouton « Appliquer ».
            </li>
          </ul>
          <p className="text-text-dim pt-1">
            Exemple : <em>« Mon DC stagne à 80 kg, que faire ? »</em> ou clique
            sur <strong>Mise à jour intelligente</strong> pour une analyse
            complète basée sur la surcharge progressive.
          </p>
        </div>
        {availableModels && (
          <div className="mt-3 text-xs bg-bg-soft border border-border rounded-lg px-3 py-2 space-y-1">
            <div className="font-semibold text-text">
              Modèles disponibles ({availableModels.length}) — modèle actuel :{" "}
              <code className="font-mono text-accent-soft">
                {config?.model}
              </code>
            </div>
            <div className="font-mono text-text-muted break-all">
              {availableModels.length === 0
                ? "(vide)"
                : availableModels.join(", ")}
            </div>
            <div className="text-text-dim">
              Si ton modèle n'est pas dans la liste, copie un nom ci-dessus dans{" "}
              <code className="font-mono">VITE_LLM_MODEL</code> (
              <code className="font-mono">.env</code>) puis redémarre{" "}
              <code className="font-mono">npm run dev</code>.
            </div>
          </div>
        )}
        {!config && (
          <div className="mt-3 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 space-y-1">
            <div className="font-semibold">Clé API manquante</div>
            <div className="text-text-muted">
              Crée un fichier <code className="font-mono">.env</code> à la
              racine avec{" "}
              <code className="font-mono">VITE_LLM_API_KEY=…</code> puis
              redémarre <code className="font-mono">npm run dev</code>. Les
              variables Vite ne sont lues qu'au démarrage.
            </div>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="card !p-3 max-h-[60vh] overflow-y-auto space-y-3"
      >
        {messages.length === 0 && !loading && (
          <div className="text-center text-text-dim text-sm py-10 px-4">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Démarre une conversation avec ton coach.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} message={m} onShowRec={setActiveRec} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-text-muted text-sm px-2 py-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            Le coach réfléchit…
          </div>
        )}
        {error && (
          <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 sticky bottom-0 bg-bg pt-2"
      >
        <input
          className="input flex-1"
          placeholder={
            config
              ? "Pose ta question au coach…"
              : "Ajoute VITE_LLM_API_KEY dans .env puis redémarre le serveur"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {activeRec && (
        <RecommendationModal
          recommendation={activeRec}
          programs={programs}
          onApply={(next) => {
            onApplyPrograms(next);
            setActiveRec(null);
          }}
          onClose={() => setActiveRec(null)}
        />
      )}
    </div>
  );
}

function Bubble({
  message,
  onShowRec,
}: {
  message: DisplayMessage;
  onShowRec: (r: ProgramRecommendation) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={[
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-bg",
          isUser ? "bg-powder" : "bg-accent",
        ].join(" ")}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={[
          "rounded-lg px-3 py-2 max-w-[85%] text-sm",
          isUser
            ? "bg-powder-muted border border-powder/30 text-text"
            : "bg-bg-soft border border-border text-text",
        ].join(" ")}
      >
        <div className="prose-coach">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        {message.recommendation && (
          <button
            className="mt-2 text-xs font-medium text-accent-soft hover:text-accent inline-flex items-center gap-1"
            onClick={() => onShowRec(message.recommendation!)}
          >
            <Sparkles className="w-3 h-3" /> Voir les{" "}
            {message.recommendation.shortTerm.length} modification
            {message.recommendation.shortTerm.length > 1 ? "s" : ""} proposée
            {message.recommendation.shortTerm.length > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
