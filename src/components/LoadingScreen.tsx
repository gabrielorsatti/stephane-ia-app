import { Logo } from "./Logo";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="animate-splash-text flex flex-col items-center gap-3">
        <div className="text-[#7C3AED]">
          <Logo size={48} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Stephane IA
        </h1>
      </div>
    </div>
  );
}
