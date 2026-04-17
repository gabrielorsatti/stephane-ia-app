import { ArrowLeft } from "lucide-react";

interface Props {
  title: string;
  onBack: () => void;
}

export function HubHeader({ title, onBack }: Props) {
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{title}</span>
    </button>
  );
}
