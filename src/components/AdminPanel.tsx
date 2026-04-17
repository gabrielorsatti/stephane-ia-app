import { Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
}

// UUID du créateur / administrateur. Seul cet utilisateur (ou is_admin=true)
// peut accéder à cette vue.
export const ADMIN_UID = "e6bc1982-f421-4847-8d1a-bb6d9b5e694f";

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const client = getSupabase();
      if (!client) {
        setLoading(false);
        return;
      }
      const { data, error } = await client
        .from("profiles")
        .select("id, username, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[AdminPanel]", error);
        setLoading(false);
        return;
      }
      setUsers(
        (data ?? []).map((r) => ({
          id: r.id,
          username: r.username,
          createdAt: r.created_at,
        })),
      );
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div className="space-y-4">
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
                  <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      @{u.username}
                    </div>
                    <div className="text-[11px] text-text-dim font-mono truncate">
                      {u.id}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-text-muted shrink-0 ml-2">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-text-dim flex items-center gap-2">
        <Users className="w-3 h-3" />
        Les emails ne sont jamais exposés — seuls les pseudos sont visibles.
      </div>
    </div>
  );
}
