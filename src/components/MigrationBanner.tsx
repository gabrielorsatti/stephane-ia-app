import { ArrowRight } from "lucide-react";

const NEW_URL = "https://app.stephane.fit/";

export function MigrationBanner() {
  if (!window.location.href.includes("Personnal-gym-tracker")) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur flex items-center justify-center p-6">
      <div className="card max-w-md w-full text-center space-y-5 !p-8 border-accent/40 shadow-2xl">
        <div className="text-4xl">🚀</div>
        <h2 className="text-xl font-bold">
          Stéphane-IA fait peau neuve&nbsp;!
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Pour profiter des mises à jour, supprimez cette icône et ajoutez la
          nouvelle version à votre écran d'accueil.
        </p>
        <a
          href={NEW_URL}
          className="btn-primary inline-flex items-center gap-2 !px-6 !py-3 text-base"
        >
          Y aller
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
