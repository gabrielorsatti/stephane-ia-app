// Logo SVG custom — haltère stylisée en lignes fines, minimaliste.
// Utilise currentColor pour s'adapter à la couleur du conteneur.
interface Props {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 24 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Barre centrale */}
      <line x1="10" y1="16" x2="22" y2="16" />
      {/* Poids gauche */}
      <line x1="7" y1="11" x2="7" y2="21" />
      <line x1="10" y1="9" x2="10" y2="23" />
      {/* Poids droit */}
      <line x1="22" y1="9" x2="22" y2="23" />
      <line x1="25" y1="11" x2="25" y2="21" />
      {/* Serre-flanc pastille centrale */}
      <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
