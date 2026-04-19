import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Brain, Dumbbell, Rss } from "lucide-react";
import type { FeedPost } from "../types";
import { sessionVolume } from "../lib/scoring";
import { EmptyState } from "./EmptyState";

interface Props {
  posts: FeedPost[];
  loading: boolean;
}

export function FeedView({ posts, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bg-soft" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-bg-soft rounded w-1/3" />
                <div className="h-3 bg-bg-soft rounded w-1/4" />
              </div>
            </div>
            <div className="h-16 bg-bg-soft rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Rss}
        title="Rien dans ton flux"
        description="Ajoute des amis pour voir leurs séances publiées ici."
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <FeedCard
          key={post.session.id}
          post={post}
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

function FeedCard({
  post,
  style,
}: {
  post: FeedPost;
  style?: React.CSSProperties;
}) {
  const { session, authorUsername } = post;
  const vol = Math.round(sessionVolume(session));
  const categories = [...new Set(session.exercices.map((e) => e.categorie))];
  const title = categories.length > 0
    ? `Séance ${categories.join(" / ")}`
    : "Séance";

  const timeAgo = session.publishedAt
    ? formatDistanceToNow(parseISO(session.publishedAt), {
        addSuffix: true,
        locale: fr,
      })
    : "";

  return (
    <div className="card space-y-3 animate-fadeIn" style={style}>
      {/* Header — avatar + name + time */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-lg shrink-0">
          {authorUsername[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">@{authorUsername}</div>
          <div className="text-[11px] text-text-dim">{timeAgo}</div>
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <Dumbbell className="w-4 h-4" />
          <span className="text-xs font-medium">{vol} kg</span>
        </div>
      </div>

      {/* Body — title + exercises */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {session.exercices.map((ex, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-2.5 py-1.5 text-xs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium truncate">{ex.nom}</span>
                <span className="chip bg-accent-muted/40 text-accent-soft text-[10px] !py-0 !px-1.5">
                  {ex.categorie}
                </span>
              </div>
              <span className="text-text-dim shrink-0 ml-1.5">
                {ex.sets.map((s) => `${s.reps}×${s.poids || "PDC"}`).join(" · ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* User comment */}
      {session.userComment && (
        <p className="text-sm text-text-muted">
          {session.userComment}
        </p>
      )}

      {/* Coach commentary footer */}
      {session.coachCommentary && (
        <div className="bg-accent-muted/15 border border-accent-muted/40 rounded-xl px-3 py-2 space-y-1">
          <div className="flex items-center gap-1.5 text-accent-soft text-[10px] font-semibold uppercase tracking-wide">
            <Brain className="w-3 h-3" />
            L'avis du Coach
          </div>
          <p className="text-[11px] text-text-muted italic leading-relaxed">
            {session.coachCommentary}
          </p>
        </div>
      )}
    </div>
  );
}
