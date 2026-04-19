import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-bg-elev flex items-center justify-center">
        <Icon className="w-6 h-6 text-text-dim" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-muted">{title}</p>
        <p className="text-xs text-text-dim mt-1 max-w-xs mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
}
