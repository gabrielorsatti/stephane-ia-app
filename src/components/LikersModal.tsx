import { X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { UserBadge } from "./UserBadge";

interface Liker {
  userId: string;
  username: string;
  avatarUrl?: string;
}

interface Props {
  sessionId: string;
  onClose: () => void;
}

export function LikersModal({ sessionId, onClose }: Props) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const client = getSupabase();
      if (!client) return;

      const { data: likes } = await client
        .from("likes")
        .select("user_id")
        .eq("session_id", sessionId);

      if (!likes || likes.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = likes.map((l) => l.user_id);
      const { data: profiles } = await client
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      setLikers(
        (profiles ?? []).map((p) => ({
          userId: p.id,
          username: p.username,
          avatarUrl: p.avatar_url ?? undefined,
        })),
      );
      setLoading(false);
    }

    void load();
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="card w-full max-w-sm max-h-[70vh] flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-sm font-semibold">Qui a aimé cette séance ?</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-elev text-text-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-bg-soft" />
                  <div className="h-4 bg-bg-soft rounded w-24" />
                </div>
              ))}
            </div>
          ) : likers.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Aucun kudo pour l'instant.</p>
          ) : (
            likers.map((l) => (
              <div key={l.userId} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-bg-soft transition-colors">
                <UserBadge username={l.username} avatarUrl={l.avatarUrl} size="md" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
