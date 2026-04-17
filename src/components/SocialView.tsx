import {
  Check,
  Clock,
  Search,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Friendship, Profile } from "../types";
import { FriendProfile } from "./FriendProfile";

interface Props {
  userId: string;
  profile: Profile;
  accepted: Friendship[];
  pendingReceived: Friendship[];
  pendingSent: Friendship[];
  onSearch: (query: string) => Promise<Profile[]>;
  onSendRequest: (receiverId: string) => Promise<void>;
  onAccept: (friendshipId: string) => Promise<void>;
  onReject: (friendshipId: string) => Promise<void>;
  onRemove: (friendshipId: string) => Promise<void>;
}

export function SocialView({
  userId,
  profile,
  accepted,
  pendingReceived,
  pendingSent,
  onSearch,
  onSendRequest,
  onAccept,
  onReject,
  onRemove,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [viewingFriend, setViewingFriend] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const r = await onSearch(query);
      setResults(r);
    } catch {
      setError("Recherche échouée");
    }
    setSearching(false);
  }

  async function action(fn: () => Promise<void>, key: string) {
    setActionLoading(key);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
    setActionLoading(null);
  }

  // Déterminer si un user est déjà ami ou en attente.
  const allIds = new Map<string, { status: string; id: string }>();
  for (const f of [...accepted, ...pendingReceived, ...pendingSent]) {
    const otherId = f.senderId === userId ? f.receiverId : f.senderId;
    allIds.set(otherId, { status: f.status, id: f.id });
  }

  if (viewingFriend) {
    return (
      <div className="space-y-4">
        <button
          className="btn-ghost text-sm"
          onClick={() => setViewingFriend(null)}
        >
          &larr; Retour
        </button>
        <FriendProfile userId={viewingFriend} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mon profil */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-lg">
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">@{profile.username}</div>
            <div className="text-xs text-text-muted">
              Membre depuis{" "}
              {new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Rechercher un membre</h3>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSearch();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            className="input flex-1"
            placeholder="Pseudo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary text-sm"
            disabled={searching || !query.trim()}
          >
            {searching ? "…" : "Chercher"}
          </button>
        </form>
        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map((r) => {
              const existing = allIds.get(r.id);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-medium">@{r.username}</span>
                  {existing ? (
                    <span className="text-xs text-text-muted capitalize">
                      {existing.status === "accepted"
                        ? "Ami"
                        : "En attente"}
                    </span>
                  ) : (
                    <button
                      className="btn-ghost text-xs"
                      disabled={actionLoading === r.id}
                      onClick={() =>
                        action(() => onSendRequest(r.id), r.id)
                      }
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {error && (
          <div className="text-xs text-rose-400 mt-2">{error}</div>
        )}
      </div>

      {/* Demandes reçues */}
      {pendingReceived.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold">
              Demandes reçues ({pendingReceived.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingReceived.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-3 py-2"
              >
                <span className="text-sm">
                  @{f.senderUsername ?? "?"}
                </span>
                <div className="flex gap-1">
                  <button
                    className="btn-ghost text-xs text-green-400"
                    disabled={actionLoading === f.id}
                    onClick={() => action(() => onAccept(f.id), f.id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="btn-ghost text-xs text-rose-400"
                    disabled={actionLoading === f.id}
                    onClick={() => action(() => onReject(f.id), f.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demandes envoyées */}
      {pendingSent.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-semibold">
              Demandes envoyées ({pendingSent.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingSent.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-3 py-2"
              >
                <span className="text-sm text-text-muted">
                  @{f.receiverUsername ?? "?"}
                </span>
                <span className="text-[11px] text-text-dim">En attente</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amis */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">
            Amis ({accepted.length})
          </h3>
        </div>
        {accepted.length === 0 ? (
          <p className="text-xs text-text-dim">
            Aucun ami pour le moment. Recherche un pseudo ci-dessus.
          </p>
        ) : (
          <div className="space-y-2">
            {accepted.map((f) => {
              const isSender = f.senderId === userId;
              const friendId = isSender ? f.receiverId : f.senderId;
              const friendName = isSender
                ? f.receiverUsername
                : f.senderUsername;
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-3 py-2"
                >
                  <button
                    className="text-sm font-medium hover:text-accent transition-colors"
                    onClick={() => setViewingFriend(friendId)}
                  >
                    @{friendName ?? "?"}
                  </button>
                  <button
                    className="btn-ghost text-xs text-text-dim hover:text-rose-400"
                    disabled={actionLoading === f.id}
                    onClick={() => {
                      if (confirm(`Retirer @${friendName ?? "?"} ?`))
                        void action(() => onRemove(f.id), f.id);
                    }}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
