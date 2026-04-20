import { Info, Leaf, X } from "lucide-react";
import { useMemo, useState } from "react";

const STORAGE_KEY = "gym-tracker:ai-usage";
const CO2_PER_1000_TOKENS = 0.3; // gCO2e per 1000 tokens

interface AiUsage {
  promptCount: number;
  totalTokens: number;
}

export function getAiUsage(): AiUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { promptCount: 0, totalTokens: 0 };
    return JSON.parse(raw);
  } catch {
    return { promptCount: 0, totalTokens: 0 };
  }
}

export function trackAiUsage(tokens: number) {
  const current = getAiUsage();
  const updated = {
    promptCount: current.promptCount + 1,
    totalTokens: current.totalTokens + tokens,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function GreenImpact() {
  const [showMethodo, setShowMethodo] = useState(false);
  const usage = useMemo(() => getAiUsage(), []);
  const co2g = (usage.totalTokens / 1000) * CO2_PER_1000_TOKENS;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
          <Leaf className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Mon Impact IA</p>
          <p className="text-xs text-text-muted">Consommation du coach IA</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Prompts" value={usage.promptCount.toString()} />
        <Stat label="Tokens" value={formatNumber(usage.totalTokens)} />
        <Stat label="CO₂e" value={`${co2g < 1 ? co2g.toFixed(2) : co2g.toFixed(1)}g`} />
      </div>

      <button
        onClick={() => setShowMethodo(true)}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-soft transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        Voir la méthodologie
      </button>

      {showMethodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowMethodo(false)}>
          <div className="card w-full max-w-sm animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Méthodologie</h3>
              <button onClick={() => setShowMethodo(false)} className="p-1 text-text-dim hover:text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-text-muted space-y-2">
              <p>
                L'estimation du coût carbone est basée sur la consommation électrique
                des serveurs de calcul IA (GPU) utilisés pour générer les réponses du coach.
              </p>
              <p>
                <span className="font-semibold text-text">Base de calcul :</span>{" "}
                ~0,3 gCO₂e pour 1 000 tokens traités. Cette valeur inclut l'énergie du
                datacenter, le refroidissement et le mix électrique moyen.
              </p>
              <p>
                <span className="font-semibold text-text">Contexte :</span>{" "}
                Un trajet de 1 km en voiture émet environ 120 gCO₂e.
                L'ensemble de tes interactions avec le coach IA représente une fraction
                négligeable de ton empreinte quotidienne.
              </p>
              <p className="text-text-dim italic">
                Source : estimations basées sur les rapports publics d'Anthropic et de l'IEA
                sur la consommation énergétique des datacenters.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-soft border border-border rounded-lg px-3 py-2 text-center">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] text-text-dim">{label}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}
