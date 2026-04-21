import { useEffect, useState } from "react";
import { levelTitle } from "../lib/leveling";

interface Props {
  level: number;
  onDone: () => void;
}

export function LevelUpCelebration({ level, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-400 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={() => { setVisible(false); setTimeout(onDone, 400); }}
    >
      <div className="text-center animate-levelUp">
        <div className="text-6xl mb-4">🏆</div>
        <div className="text-3xl font-black text-accent animate-pulse">
          LEVEL UP !
        </div>
        <div className="text-xl font-bold text-white mt-2">
          Niveau {level}
        </div>
        <div className="text-sm text-accent-soft mt-1">
          {levelTitle(level)}
        </div>
        <div className="confetti-container">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ["#7C3AED", "#A78BFA", "#F59E0B", "#34D399", "#F472B6", "#60A5FA"][i % 6],
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
