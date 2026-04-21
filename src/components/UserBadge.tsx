import { LevelBadge } from "./LevelBadge";

interface Props {
  username: string;
  avatarUrl?: string;
  level?: number;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const SIZES = {
  sm: { avatar: "w-6 h-6", text: "text-xs", initial: "text-xs" },
  md: { avatar: "w-8 h-8", text: "text-sm", initial: "text-sm" },
  lg: { avatar: "w-10 h-10", text: "text-sm", initial: "text-lg" },
};

export function UserBadge({ username, avatarUrl, level, size = "sm", onClick }: Props) {
  const s = SIZES[size];

  const content = (
    <>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={`${s.avatar} rounded-full object-cover shrink-0`} />
      ) : (
        <div className={`${s.avatar} rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold ${s.initial} shrink-0`}>
          {username[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <span className={`${s.text} font-semibold truncate`}>@{username}</span>
      {level != null && level > 0 && (
        <LevelBadge level={level} size={size === "sm" ? "sm" : "md"} />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        className="flex items-center gap-2 min-w-0 hover:text-accent transition-colors"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-center gap-2 min-w-0">{content}</div>;
}
