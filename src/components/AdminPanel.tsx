import { Activity, DollarSign, Shield, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { UserBadge } from "./UserBadge";

interface AdminUser {
  id: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
  friendCount: number;
}

interface UsageRow {
  userId: string;
  username: string;
  avatarUrl?: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

// UUID du créateur / administrateur. Seul cet utilisateur (ou is_admin=true)
// peut accéder à cette vue.
export const ADMIN_UID = "e6bc1982-f421-4847-8d1a-bb6d9b5e694f";

const TOKEN_WARN_THRESHOLD = 50_000;

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usageRows, setUsageRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      setUsageLoading(false);
      return;
    }

    async function loadUsers() {
      const { data, error } = await client!
        .from("profiles")
        .select("id, username, avatar_url, created_at")
        .order("created_at", { ascending: false });
      if (error) console.warn("[AdminPanel]", error);

      const { data: friendships } = await client!
        .from("friendships")
        .select("sender_id, receiver_id")
        .eq("status", "accepted");

      const friendCounts = new Map<string, number>();
      for (const f of friendships ?? []) {
        friendCounts.set(f.sender_id, (friendCounts.get(f.sender_id) ?? 0) + 1);
        friendCounts.set(f.receiver_id, (friendCounts.get(f.receiver_id) ?? 0) + 1);
      }

      setUsers(
        (data ?? []).map((r) => ({
          id: r.id,
          username: r.username,
          avatarUrl: r.avatar_url ?? undefined,
          createdAt: r.created_at,
          friendCount: friendCounts.get(r.id) ?? 0,
        })),
      );
      setLoading(false);
    }

    async function loadUsage() {
      const { data: logs, error } = await client!
        .from("api_usage_logs")
        .select("user_id, input_tokens, output_tokens, estimated_cost");
      if (error) {
        console.warn("[AdminPanel] usage", error);
        setUsageLoading(false);
        return;
      }
      const { data: profiles } = await client!
        .from("profiles")
        .select("id, username, avatar_url");

      const profileMap = new Map<string, { username: string; avatarUrl?: string }>();
      for (const p of profiles ?? []) profileMap.set(p.id, { username: p.username, avatarUrl: p.avatar_url ?? undefined });

      const agg = new Map<string, UsageRow>();
      for (const log of logs ?? []) {
        const uid = log.user_id;
        const existing = agg.get(uid);
        if (existing) {
          existing.requestCount++;
          existing.totalInputTokens += log.input_tokens;
          existing.totalOutputTokens += log.output_tokens;
          existing.totalCost += log.estimated_cost;
        } else {
          agg.set(uid, {
            userId: uid,
            username: profileMap.get(uid)?.username ?? uid.slice(0, 8),
            avatarUrl: profileMap.get(uid)?.avatarUrl,
            requestCount: 1,
            totalInputTokens: log.input_tokens,
            totalOutputTokens: log.output_tokens,
            totalCost: log.estimated_cost,
          });
        }
      }
      setUsageRows(
        Array.from(agg.values()).sort((a, b) => b.totalCost - a.totalCost),
      );
      setUsageLoading(false);
    }

    void loadUsers();
    void loadUsage();
  }, []);

  const totalCost = usageRows.reduce((s, r) => s + r.totalCost, 0);
  const totalRequests = usageRows.reduce((s, r) => s + r.requestCount, 0);
  const avgCostPerUser =
    usageRows.length > 0 ? totalCost / usageRows.length : 0;

  return (
    <div className="space-y-4">
      {/* ── Users ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Administration</h2>
          <span className="chip bg-accent-muted/40 text-accent-soft text-xs">
            {users.length} inscrits
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 bg-bg-soft border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserBadge username={u.username} avatarUrl={u.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-text-dim font-mono truncate">
                      {u.id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-[11px] text-text-dim">
                    {u.friendCount} ami{u.friendCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FinOps — Business Center ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-powder" />
          <h2 className="text-lg font-semibold">Business Center</h2>
          <span className="chip bg-powder-muted/60 text-powder-soft text-xs">
            FinOps
          </span>
        </div>

        {usageLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-bg-soft border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <KpiCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Coût total"
                value={`${totalCost.toFixed(4)} $`}
                accent="accent"
              />
              <KpiCard
                icon={<Zap className="w-4 h-4" />}
                label="Requêtes"
                value={String(totalRequests)}
                accent="powder"
              />
              <KpiCard
                icon={<Users className="w-4 h-4" />}
                label="Coût moyen / user"
                value={`${avgCostPerUser.toFixed(4)} $`}
                accent="lavender"
              />
            </div>

            {/* Usage table */}
            {usageRows.length === 0 ? (
              <div className="text-sm text-text-dim text-center py-6">
                Aucune consommation API enregistrée.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-text-muted border-b border-border">
                      <th className="pb-2 pr-2">Pseudo</th>
                      <th className="pb-2 pr-2 text-right">Chats</th>
                      <th className="pb-2 pr-2 text-right">Tokens (in)</th>
                      <th className="pb-2 pr-2 text-right">Tokens (out)</th>
                      <th className="pb-2 text-right">Coût ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageRows.map((r) => {
                      const totalTokens =
                        r.totalInputTokens + r.totalOutputTokens;
                      const warn = totalTokens > TOKEN_WARN_THRESHOLD;
                      return (
                        <tr
                          key={r.userId}
                          className={`border-b border-border/50 ${warn ? "text-rose-400" : ""}`}
                        >
                          <td className="py-1.5 pr-2 font-medium">
                            <UserBadge username={r.username} avatarUrl={r.avatarUrl} size="sm" />
                          </td>
                          <td className="py-1.5 pr-2 text-right">
                            {r.requestCount}
                          </td>
                          <td className="py-1.5 pr-2 text-right font-mono">
                            {r.totalInputTokens.toLocaleString("fr-FR")}
                          </td>
                          <td className="py-1.5 pr-2 text-right font-mono">
                            {r.totalOutputTokens.toLocaleString("fr-FR")}
                          </td>
                          <td className="py-1.5 text-right font-mono">
                            {r.totalCost.toFixed(4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-[11px] text-text-dim flex items-center gap-2">
        <Users className="w-3 h-3" />
        Les emails ne sont jamais exposés — seuls les pseudos sont visibles.
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "accent" | "powder" | "lavender";
}) {
  const colors = {
    accent: "bg-accent-muted/30 text-accent",
    powder: "bg-powder-muted/30 text-powder",
    lavender: "bg-lavender-muted/30 text-lavender",
  };
  return (
    <div className="bg-bg-soft border border-border rounded-xl px-3 py-3">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center ${colors[accent]}`}
        >
          {icon}
        </div>
        <span className="text-[11px] text-text-muted">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
