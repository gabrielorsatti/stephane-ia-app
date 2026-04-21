import { Battery, Droplets, Info, Leaf, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const STORAGE_KEY = "gym-tracker:ai-usage";

// Ratios — estimations moyennes hautes pour transparence
const CO2_PER_1000_TOKENS = 0.5; // gCO2e
const WH_PER_REQUEST = 1; // Wh par requête (≈ 0.001 kWh)
const ML_WATER_PER_REQUEST = 15; // ml (moyenne 5–50ml, source UCR)
const CO2_PER_KM_CAR = 120; // gCO2e (ADEME, citadine thermique)
const WH_PER_PHONE_CHARGE = 15; // Wh (batterie ~4000mAh × 3.8V ≈ 15Wh)

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
  const energyWh = usage.promptCount * WH_PER_REQUEST;
  const waterMl = usage.promptCount * ML_WATER_PER_REQUEST;

  const eqKm = co2g / CO2_PER_KM_CAR;
  const eqCharges = energyWh / WH_PER_PHONE_CHARGE;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
          <Leaf className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Mon Impact IA</p>
          <p className="text-xs text-text-muted">{usage.promptCount} requête{usage.promptCount !== 1 ? "s" : ""} · {formatNumber(usage.totalTokens)} tokens</p>
        </div>
      </div>

      {/* 3 métriques principales */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          icon={<Leaf className="w-3.5 h-3.5" />}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/15"
          value={formatCo2(co2g)}
          label="CO₂e"
        />
        <MetricCard
          icon={<Zap className="w-3.5 h-3.5" />}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/15"
          value={formatEnergy(energyWh)}
          label="Énergie"
        />
        <MetricCard
          icon={<Droplets className="w-3.5 h-3.5" />}
          iconColor="text-sky-500"
          iconBg="bg-sky-500/15"
          value={formatWater(waterMl)}
          label="Eau"
        />
      </div>

      {/* Équivalences */}
      {usage.promptCount > 0 && (
        <div className="bg-bg-soft border border-border rounded-lg p-3 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Équivalences</p>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>🚗</span>
            <span>{eqKm < 0.01 ? "< 0,01" : eqKm.toFixed(2)} km en voiture</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span><Battery className="w-3.5 h-3.5 inline" /></span>
            <span>{eqCharges < 0.1 ? "< 0,1" : eqCharges.toFixed(1)} recharge{eqCharges >= 2 ? "s" : ""} de smartphone</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowMethodo(true)}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-soft transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        Comment est-ce calculé ?
      </button>

      {showMethodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowMethodo(false)}>
          <div className="card w-full max-w-md max-h-[80vh] overflow-y-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Méthodologie & Sources</h3>
              <button onClick={() => setShowMethodo(false)} className="p-1 text-text-dim hover:text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-text-muted space-y-3">
              <section>
                <h4 className="font-semibold text-text mb-1">Empreinte carbone</h4>
                <p>
                  Estimation : <span className="font-mono text-accent">0,5 gCO₂e / 1 000 tokens</span>.
                  Ce ratio intègre la consommation électrique directe des GPU,
                  le PUE (Power Usage Effectiveness) moyen des datacenters (~1.2),
                  et l'intensité carbone du mix électrique (moyenne mondiale ~450 gCO₂/kWh).
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-text mb-1">Consommation énergétique</h4>
                <p>
                  Estimation : <span className="font-mono text-accent">~1 Wh par requête</span> (≈ 0,001 kWh).
                  Basée sur la puissance d'un GPU A100 (~300W) et le temps d'inférence moyen
                  d'un modèle 70B (quelques secondes par requête).
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-text mb-1">Consommation d'eau</h4>
                <p>
                  Estimation : <span className="font-mono text-accent">~15 ml par requête</span> (fourchette 5–50 ml).
                  L'eau est utilisée principalement pour le refroidissement par
                  évaporation des datacenters. Ce chiffre varie fortement selon le
                  climat et la technologie de refroidissement.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-text mb-1">Équivalences</h4>
                <p>
                  <span className="font-semibold">Voiture :</span> 120 gCO₂e/km — moyenne ADEME pour une
                  citadine thermique en France (cycle mixte, véhicule récent).
                </p>
                <p>
                  <span className="font-semibold">Smartphone :</span> ~15 Wh pour une charge complète
                  (batterie 4 000 mAh × 3,8V, rendement chargeur ~85%).
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-text mb-1">Facteurs de variation</h4>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Taille du modèle : un modèle 70B est ~5× plus gourmand qu'un 7B</li>
                  <li>Localisation du serveur : énergie décarbonée (France, Suède) vs fossile (Pologne, Inde)</li>
                  <li>Longueur de la conversation : chaque token de contexte est re-traité</li>
                  <li>Batch size et optimisations serveur (quantization, speculative decoding)</li>
                </ul>
              </section>

              <section className="border-t border-border pt-3">
                <h4 className="font-semibold text-text mb-1">Sources</h4>
                <ul className="space-y-1">
                  <li>Luccioni, A.S. et al. (2023) — <em>"Power Hungry Processing: Watts Driving the Cost of AI Deployment?"</em>, Hugging Face / Mila</li>
                  <li>Li, P. et al. (2023) — <em>"Making AI Less Thirsty"</em>, UC Riverside — consommation hydrique des LLM</li>
                  <li>ADEME (2024) — Base Carbone, facteurs d'émission transport routier France</li>
                  <li>IEA (2024) — <em>Electricity Market Report</em>, intensité carbone par région</li>
                  <li>Patterson, D. et al. (2022) — <em>"The Carbon Footprint of Machine Learning Training"</em>, Google Research</li>
                </ul>
              </section>

              <p className="text-text-dim italic pt-2">
                Ces estimations sont volontairement hautes (worst case) pour garantir
                la transparence. L'impact r��el est probablement inférieur si le serveur
                utilise de l'énergie décarbonée.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, iconColor, iconBg, value, label }: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-bg-soft border border-border rounded-lg px-2.5 py-2.5 text-center">
      <div className={`w-6 h-6 rounded-full ${iconBg} ${iconColor} flex items-center justify-center mx-auto mb-1`}>
        {icon}
      </div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-xs text-text-dim">{label}</div>
    </div>
  );
}

function formatCo2(g: number): string {
  if (g < 0.01) return "0g";
  if (g < 1) return `${g.toFixed(2)}g`;
  if (g >= 1000) return `${(g / 1000).toFixed(1)}kg`;
  return `${g.toFixed(1)}g`;
}

function formatEnergy(wh: number): string {
  if (wh === 0) return "0 Wh";
  if (wh >= 1000) return `${(wh / 1000).toFixed(1)} kWh`;
  return `${wh.toFixed(0)} Wh`;
}

function formatWater(ml: number): string {
  if (ml === 0) return "0 ml";
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} L`;
  return `${ml.toFixed(0)} ml`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}
