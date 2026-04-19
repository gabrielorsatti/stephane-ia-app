import { Activity, Calendar, Dumbbell, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { useProfile } from "../hooks/useProfile";
import { usePublicStats } from "../hooks/usePublicStats";
import { UserBadge } from "./UserBadge";

interface Props {
  userId: string;
}

function useFriendCount(userId: string): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    void client
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .then(({ count: c }) => setCount(c ?? 0));
  }, [userId]);
  return count;
}

export function FriendProfile({ userId }: Props) {
  const { profile, loading: pLoading } = useProfile(userId);
  const { stats, loading: sLoading } = usePublicStats(userId);
  const friendCount = useFriendCount(userId);

  if (pLoading || sLoading) {
    return (
      <div className="card animate-pulse space-y-3">
        <div className="h-6 bg-bg-soft rounded w-1/3" />
        <div className="h-4 bg-bg-soft rounded w-2/3" />
        <div className="h-20 bg-bg-soft rounded" />
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="card text-sm text-text-muted">Profil introuvable.</div>
    );
  }

  const memberMonths = Math.max(
    1,
    Math.round(
      (Date.now() - new Date(stats.memberSince).getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    ),
  );

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <UserBadge username={profile.username} avatarUrl={profile.avatarUrl} size="lg" />
          <div>
            <div className="text-xs text-text-muted">
              Membre depuis {memberMonths} mois
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="Séances"
            value={String(stats.totalSessions)}
          />
          <StatCard
            icon={<Dumbbell className="w-4 h-4" />}
            label="Volume total"
            value={formatVolume(stats.totalVolume)}
          />
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Amis"
            value={String(friendCount)}
          />
        </div>
      </div>

      {stats.topExercises.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold">Top exercices</h3>
          </div>
          <div className="space-y-2">
            {stats.topExercises.map((ex, i) => (
              <div
                key={ex.nom}
                className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold text-sm">
                    #{i + 1}
                  </span>
                  <span className="text-sm">{ex.nom}</span>
                </div>
                <span className="text-xs text-text-muted">
                  {ex.count} séance{ex.count > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Activité</h3>
        </div>
        <div className="text-xs text-text-muted">
          ~{(stats.totalSessions / memberMonths).toFixed(1)} séances/mois en
          moyenne
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-bg-soft border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 text-text-muted mb-1">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function formatVolume(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)}M kg`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k kg`;
  return `${kg} kg`;
}
