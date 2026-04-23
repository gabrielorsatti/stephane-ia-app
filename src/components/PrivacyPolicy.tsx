import { ArrowLeft, Shield } from "lucide-react";

interface Props {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: Props) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="card space-y-5">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold">Politique de confidentialité</h1>
        </div>
        <p className="text-xs text-text-dim">Dernière mise à jour : avril 2026</p>

        <Section title="1. Données collectées">
          <p>Stephane IA collecte les données suivantes dans le cadre de son fonctionnement :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Données d'entraînement</strong> : séances, exercices, séries, charges, durées.</li>
            <li><strong>Données corporelles</strong> : poids de corps (si renseigné).</li>
            <li><strong>Données nutritionnelles</strong> : descriptions de repas, macronutriments estimés.</li>
            <li><strong>Profil</strong> : pseudo, photo de profil, bio.</li>
            <li><strong>Interactions sociales</strong> : commentaires, kudos, relations d'amitié.</li>
          </ul>
        </Section>

        <Section title="2. Finalité du traitement">
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Afficher votre historique d'entraînement et vos statistiques de progression.</li>
            <li>Alimenter le coach IA « Stéphane » avec votre contexte de performance pour des conseils personnalisés.</li>
            <li>Permettre les interactions sociales (flux d'activité, kudos, commentaires) avec vos amis.</li>
          </ul>
          <p className="mt-2">Aucune donnée n'est vendue, louée ou partagée avec des tiers à des fins commerciales.</p>
        </Section>

        <Section title="3. Stockage et sécurité">
          <p>
            Les données sont stockées sur <strong>Supabase</strong> (PostgreSQL), hébergé en Europe (AWS eu-west).
            Toutes les communications sont chiffrées via HTTPS/TLS.
            L'isolation des données est garantie par des politiques Row Level Security (RLS) :
            chaque utilisateur ne peut accéder qu'à ses propres données.
          </p>
        </Section>

        <Section title="4. Intelligence artificielle">
          <p>
            Le coach Stéphane utilise l'API Claude (Anthropic) pour générer des commentaires et recommandations.
            Vos données de séance sont transmises à l'API uniquement au moment de la génération.
            Anthropic ne conserve pas les données des appels API au-delà du traitement immédiat
            (voir <em>Anthropic API Data Policy</em>).
          </p>
          <p className="mt-2 font-medium">
            Stéphane est une IA, pas un professionnel de santé. Ses conseils sont purement informatifs
            et ne remplacent en aucun cas l'avis d'un médecin ou d'un professionnel du sport.
          </p>
        </Section>

        <Section title="5. Vos droits (RGPD)">
          <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Accès</strong> : exportez toutes vos données (Réglages &gt; Données &gt; Exporter).</li>
            <li><strong>Rectification</strong> : modifiez votre profil et vos séances à tout moment.</li>
            <li><strong>Suppression</strong> : supprimez votre compte et toutes vos données (Réglages &gt; Supprimer mon compte).</li>
            <li><strong>Portabilité</strong> : l'export JSON contient l'intégralité de vos données dans un format réutilisable.</li>
          </ul>
        </Section>

        <Section title="6. Cookies et stockage local">
          <p>
            Stephane IA utilise le localStorage du navigateur pour conserver vos préférences (thème, cache de bilan, etc.)
            et un mode hors-ligne. Aucun cookie tiers, tracker ou pixel de suivi n'est utilisé.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>
            Pour toute question relative à vos données personnelles, contactez le responsable du traitement
            via le dépôt GitHub du projet ou par email à l'adresse indiquée dans les réglages.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold mb-2">{title}</h2>
      <div className="text-sm text-text-muted leading-relaxed">{children}</div>
    </div>
  );
}
