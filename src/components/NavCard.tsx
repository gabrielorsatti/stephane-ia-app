import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
}

export function NavCard({ icon: Icon, label, description, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="card flex items-center gap-3 text-left hover:border-accent/40 transition-colors group w-full"
    >
      <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text">{label}</div>
        <div className="text-xs text-text-dim truncate">{description}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-accent transition-colors shrink-0" />
    </button>
  );
}
