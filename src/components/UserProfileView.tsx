import { ArrowLeft, Calendar, Dumbbell, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { groupExercises } from "../lib/groupExercises";
import { sessionVolume } from "../lib/scoring";
import { levelFromXp } from "../lib/leveling";
import type { ExerciseEntry, Session } from "../types";
import { UserBadge } from "./UserBadge";
import { XPProgressBar } from "./XPProgressBar";

interface ProfileData {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  totalXp: number;
  createdAt: string;
}

interface Props {
  userId: string;
  onBack: () => void;
}

export function UserProfileView({ userId, onBack }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const client = getSupabase();
      if (!client) return;

      const [profileRes, sessionsRes, friendsRes] = await Promise.all([
        client.from("profiles").select("id, username, avatar_url, bio, total_xp, created_at").eq("id", userId).single(),
        client.from("sessions")
          .select("id, date, exercices, notes, body_weight, created_at, user_comment, published_at")
          .eq("user_id", userId)
          .eq("is_published", true)
          .order("date", { ascending: false })
          .limit(50),
        client.from("friendships")
          .select("id", { count: "exact", head: true })
          .eq("status", "accepted")
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
      ]);

      if (profileRes.data) {
        setProfile({
          id: profileRes.data.id,
          username: profileRes.data.username,
          avatarUrl: profileRes.data.avatar_url ?? undefined,
          bio: profileRes.data.bio ?? undefined,
          totalXp: profileRes.data.total_xp ?? 0,
          createdAt: profileRes.data.created_at,
        });
      }

      if (sessionsRes.data) {
        setSessions(sessionsRes.data.map((r) => ({
          id: r.id,
          date: r.date,
          exercices: r.exercices as ExerciseEntry[],
          notes: r.notes ?? undefined,
          bodyWeight: r.body_weight ?? undefined,
          createdAt: r.created_at ?? undefined,
          isPublished: true,
          userComment: r.user_comment ?? undefined,
          publishedAt: r.published_at ?? undefined,
        })));
      }

      setFriendCount(friendsRes.count ?? 0);
      setLoading(false);
    }

    void load();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-bg-soft" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-bg-soft rounded w-1/3" />
            <div className="h-3 bg-bg-soft rounded w-1/4" />
          </div>
        </div>
        <div className="h-24 bg-bg-soft rounded-lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card text-center text-sm text-text-muted py-8">
        Profil introuvable.
        <button onClick={onBack} className="block mx-auto mt-3 text-accent text-xs">Retour</button>
      </div>
    );
  }

  const totalVolume = sessions.reduce((sum, s) => sum + sessionVolume(s), 0);

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="card space-y-3">
        <div className="flex items-center gap-4">
          <UserBadge username={profile.username} avatarUrl={profile.avatarUrl} level={levelFromXp(profile.totalXp)} size="lg" />
        </div>
        {profile.bio && (
          <p className="text-xs text-text-muted italic">{profile.bio}</p>
        )}
        <XPProgressBar totalXp={profile.totalXp} compact />
        <div className="grid grid-cols-3 gap-3">
          <StatBox icon={<Dumbbell className="w-4 h-4" />} value={sessions.length.toString()} label="Séances" />
          <StatBox icon={<Users className="w-4 h-4" />} value={friendCount.toString()} label="Amis" />
          <StatBox icon={<Calendar className="w-4 h-4" />} value={Math.round(totalVolume / 1000).toString() + "t"} label="Volume" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold px-1">Séances publiées</h3>
        {sessions.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">Aucune séance publiée.</p>
        ) : (
          sessions.map((s) => {
            const categories = [...new Set(s.exercices.map((e) => e.categorie))];
            const vol = Math.round(sessionVolume(s));
            const dur = s.exercices.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
            const expanded = expandedId === s.id;
            return (
              <div key={s.id} className="card !p-0 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-soft transition-colors"
                  onClick={() => setExpandedId(expanded ? null : s.id)}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {categories.join(" / ") || "Séance"}
                    </div>
                    <div className="text-xs text-text-dim">{s.date}</div>
                  </div>
                  <span className="text-xs text-text-muted shrink-0 ml-2">
                    {vol > 0 ? `${vol} kg` : dur > 0 ? `${dur} min` : "—"}
                  </span>
                </button>
                {expanded && (
                  <div className="border-t border-border px-4 py-3 space-y-1.5">
                    {groupExercises(s.exercices).map((ex, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium">{ex.nom}</span>
                        <span className="text-text-dim ml-2">
                          {ex.durationMinutes
                            ? `${ex.durationMinutes} min${ex.intensity ? ` · ${ex.intensity}` : ""}`
                            : ex.sets.map((set) => `${set.reps}×${set.poids || "PDC"}`).join(" · ")}
                        </span>
                      </div>
                    ))}
                    {s.userComment && (
                      <p className="text-xs text-text-muted italic mt-2">"{s.userComment}"</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-bg-soft border border-border rounded-lg px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-accent mb-0.5">{icon}</div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-xs text-text-dim">{label}</div>
    </div>
  );
}
