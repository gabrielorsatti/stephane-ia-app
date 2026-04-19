import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Dumbbell, MessageCircle, Rss, Send, Zap } from "lucide-react";
import { useState } from "react";
import type { FeedComment, FeedPost } from "../types";
import { groupExercises } from "../lib/groupExercises";
import { sessionVolume } from "../lib/scoring";
import { EmptyState } from "./EmptyState";

interface Props {
  posts: FeedPost[];
  loading: boolean;
  onToggleLike: (sessionId: string, liked: boolean) => Promise<void>;
  onAddComment: (sessionId: string, content: string) => Promise<void>;
}

export function FeedView({ posts, loading, onToggleLike, onAddComment }: Props) {
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
          onToggleLike={onToggleLike}
          onAddComment={onAddComment}
        />
      ))}
    </div>
  );
}

function FeedCard({
  post,
  style,
  onToggleLike,
  onAddComment,
}: {
  post: FeedPost;
  style?: React.CSSProperties;
  onToggleLike: (sessionId: string, liked: boolean) => Promise<void>;
  onAddComment: (sessionId: string, content: string) => Promise<void>;
}) {
  const { session, authorUsername, authorAvatarUrl } = post;
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<FeedComment[]>(post.comments);
  const [sending, setSending] = useState(false);

  const vol = Math.round(sessionVolume(session));
  const grouped = groupExercises(session.exercices);
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

  async function handleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    await onToggleLike(session.id, wasLiked);
  }

  async function handleComment() {
    if (!commentText.trim() || sending) return;
    setSending(true);
    await onAddComment(session.id, commentText.trim());
    setLocalComments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        userId: "",
        username: "Toi",
        content: commentText.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setCommentText("");
    setSending(false);
  }

  return (
    <div className="card space-y-3 animate-fadeIn" style={style}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {authorAvatarUrl ? (
          <img src={authorAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-lg shrink-0">
            {authorUsername[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">@{authorUsername}</div>
          <div className="text-[11px] text-text-dim">{timeAgo}</div>
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <Dumbbell className="w-4 h-4" />
          <span className="text-xs font-medium">{vol} kg</span>
        </div>
      </div>

      {/* Body — grouped exercises */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {grouped.map((ex, i) => (
            <div
              key={i}
              className="bg-bg-soft border border-border rounded-lg px-2.5 py-1.5 text-xs"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-medium truncate">{ex.nom}</span>
                <span className="chip bg-accent-muted/40 text-accent-soft text-[10px] !py-0 !px-1.5 shrink-0">
                  {ex.categorie}
                </span>
              </div>
              <div className="text-text-dim">
                {ex.sets.map((s) => `${s.reps}×${s.poids || "PDC"}`).join(" · ")}
              </div>
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

      {/* Actions: Kudo + Comments */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <button
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            liked ? "text-amber-400" : "text-text-muted hover:text-amber-400"
          }`}
          onClick={() => void handleLike()}
        >
          <Zap className={`w-4 h-4 ${liked ? "fill-amber-400" : ""}`} />
          {likeCount > 0 && likeCount} Kudo{likeCount !== 1 ? "s" : ""}
        </button>
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text transition-colors"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle className="w-4 h-4" />
          {localComments.length > 0 && localComments.length} Commentaire{localComments.length !== 1 ? "s" : ""}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-2 pt-1">
          {localComments.map((c) => (
            <div key={c.id} className="flex gap-2 text-xs">
              <span className="font-semibold text-text shrink-0">@{c.username}</span>
              <span className="text-text-muted">{c.content}</span>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleComment();
            }}
          >
            <input
              className="input flex-1 !py-1.5 !text-xs"
              placeholder="Écrire un commentaire..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              className="btn-primary !py-1.5 !px-2.5"
              disabled={!commentText.trim() || sending}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
