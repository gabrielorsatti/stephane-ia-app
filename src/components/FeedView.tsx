import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Dumbbell, Flag, MessageCircle, Rss, Send, Zap } from "lucide-react";
import { useState } from "react";
import type { FeedComment, FeedPost } from "../types";
import { formatExerciseStats } from "../lib/formatExerciseStats";
import { groupExercises } from "../lib/groupExercises";
import { sessionVolume } from "../lib/scoring";
import { EmptyState } from "./EmptyState";
import { LikersModal } from "./LikersModal";
import { UserBadge } from "./UserBadge";

interface Props {
  posts: FeedPost[];
  loading: boolean;
  onToggleLike: (sessionId: string, liked: boolean) => Promise<boolean | void>;
  onAddComment: (sessionId: string, content: string) => Promise<boolean | void>;
  onViewProfile?: (userId: string) => void;
  onReport?: (contentId: string, contentType: "session" | "comment") => void;
}

export function FeedView({ posts, loading, onToggleLike, onAddComment, onViewProfile, onReport }: Props) {
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
          onViewProfile={onViewProfile}
          onReport={onReport}
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
  onViewProfile,
  onReport,
}: {
  post: FeedPost;
  style?: React.CSSProperties;
  onToggleLike: (sessionId: string, liked: boolean) => Promise<boolean | void>;
  onAddComment: (sessionId: string, content: string) => Promise<boolean | void>;
  onViewProfile?: (userId: string) => void;
  onReport?: (contentId: string, contentType: "session" | "comment") => void;
}) {
  const { session, authorId, authorUsername, authorAvatarUrl, authorLevel } = post;
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<FeedComment[]>(post.comments);
  const [sending, setSending] = useState(false);
  const [showLikers, setShowLikers] = useState(false);

  const vol = Math.round(sessionVolume(session));
  const totalDuration = session.exercices.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  const isDurationBased = vol === 0 && totalDuration > 0;
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
    const ok = await onToggleLike(session.id, wasLiked);
    if (ok === false) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  }

  async function handleComment() {
    if (!commentText.trim() || sending) return;
    setSending(true);
    const saved = commentText.trim();
    const ok = await onAddComment(session.id, saved);
    if (ok !== false) {
      setLocalComments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          userId: "",
          username: "Toi",
          content: saved,
          createdAt: new Date().toISOString(),
        },
      ]);
      setCommentText("");
    }
    setSending(false);
  }

  return (
    <div className="card space-y-3 animate-fadeIn" style={style}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserBadge
          username={authorUsername}
          avatarUrl={authorAvatarUrl}
          level={authorLevel}
          size="lg"
          onClick={onViewProfile ? () => onViewProfile(authorId) : undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-text-dim">{timeAgo}</div>
        </div>
        <div className="flex items-center gap-3 text-text-muted">
          {session.durationSeconds != null && session.durationSeconds > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">
                {Math.round(session.durationSeconds / 60)} min
              </span>
            </div>
          )}
          {isDurationBased ? (
            !session.durationSeconds && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">{totalDuration} min</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1">
              <Dumbbell className="w-4 h-4" />
              <span className="text-xs font-medium">{vol} kg</span>
            </div>
          )}
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
                <span className="chip bg-accent-muted/40 text-accent-soft text-xs !py-0 !px-1.5 shrink-0">
                  {ex.categorie}
                </span>
              </div>
              <div className="text-text-dim">
                {formatExerciseStats(ex)}
              </div>
              {ex.comment && (
                <div className="text-text-muted italic mt-0.5">« {ex.comment} »</div>
              )}
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
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <button
            className={`flex items-center gap-1 transition-colors ${
              liked ? "text-amber-400" : "text-text-muted hover:text-amber-400"
            }`}
            onClick={() => void handleLike()}
          >
            <Zap className={`w-4 h-4 ${liked ? "fill-amber-400" : ""}`} />
            Kudo{likeCount !== 1 ? "s" : ""}
          </button>
          {likeCount > 0 && (
            <button
              className="text-text-muted hover:text-accent transition-colors tabular-nums"
              onClick={() => setShowLikers(true)}
            >
              ({likeCount})
            </button>
          )}
        </div>
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text transition-colors"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle className="w-4 h-4" />
          {localComments.length > 0 && localComments.length} Commentaire{localComments.length !== 1 ? "s" : ""}
        </button>
        {onReport && (
          <button
            className="ml-auto flex items-center gap-1 text-xs text-text-dim hover:text-amber-400 transition-colors"
            onClick={() => onReport(session.id, "session")}
            title="Signaler ce post"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-2 pt-1">
          {localComments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-xs">
              <UserBadge
                username={c.username}
                avatarUrl={c.avatarUrl}
                size="sm"
                onClick={onViewProfile && c.userId ? () => onViewProfile(c.userId) : undefined}
              />
              <span className="text-text-muted pt-0.5">{c.content}</span>
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

      {showLikers && (
        <LikersModal sessionId={session.id} onClose={() => setShowLikers(false)} />
      )}
    </div>
  );
}
