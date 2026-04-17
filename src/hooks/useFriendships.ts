import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import type { Friendship, FriendshipStatus, Profile } from "../types";

function extractUsername(val: unknown): string | undefined {
  if (Array.isArray(val) && val.length > 0) return val[0]?.username;
  if (val && typeof val === "object" && "username" in val)
    return (val as { username: string }).username;
  return undefined;
}

export function useFriendships(userId: string | undefined) {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }
    const { data, error } = await client
      .from("friendships")
      .select(
        `id, sender_id, receiver_id, status, created_at,
         sender:profiles!friendships_sender_id_fkey(username),
         receiver:profiles!friendships_receiver_id_fkey(username)`,
      )
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    if (error) {
      console.warn("[useFriendships] load failed", error);
      setLoading(false);
      return;
    }
    setFriendships(
      (data ?? []).map(
        (r): Friendship => ({
          id: r.id,
          senderId: r.sender_id,
          receiverId: r.receiver_id,
          status: r.status as FriendshipStatus,
          createdAt: r.created_at,
          senderUsername: extractUsername(r.sender),
          receiverUsername: extractUsername(r.receiver),
        }),
      ),
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendRequest = useCallback(
    async (receiverId: string) => {
      if (!userId) return;
      const client = getSupabase();
      if (!client) return;
      const { error } = await client.from("friendships").insert({
        sender_id: userId,
        receiver_id: receiverId,
        status: "pending",
      });
      if (error) {
        if (error.code === "23505") throw new Error("Demande déjà envoyée");
        throw error;
      }
      await load();
    },
    [userId, load],
  );

  const accept = useCallback(
    async (friendshipId: string) => {
      const client = getSupabase();
      if (!client) return;
      const { error } = await client
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);
      if (error) throw error;
      await load();
    },
    [load],
  );

  const reject = useCallback(
    async (friendshipId: string) => {
      const client = getSupabase();
      if (!client) return;
      const { error } = await client
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
      await load();
    },
    [load],
  );

  const remove = reject;

  const searchUser = useCallback(
    async (query: string): Promise<Profile[]> => {
      const client = getSupabase();
      if (!client) return [];
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) return [];
      const { data, error } = await client
        .from("profiles")
        .select("id, username, avatar_url, is_admin, created_at")
        .ilike("username", `%${trimmed}%`)
        .neq("id", userId ?? "")
        .limit(10);
      if (error) {
        console.warn("[useFriendships] search failed", error);
        return [];
      }
      console.info("[useFriendships] search results", {
        query: trimmed,
        count: data?.length ?? 0,
      });
      return (data ?? []).map(
        (r): Profile => ({
          id: r.id,
          username: r.username,
          avatarUrl: r.avatar_url ?? undefined,
          isAdmin: r.is_admin,
          createdAt: r.created_at,
        }),
      );
    },
    [userId],
  );

  const accepted = friendships.filter((f) => f.status === "accepted");
  const pendingReceived = friendships.filter(
    (f) => f.status === "pending" && f.receiverId === userId,
  );
  const pendingSent = friendships.filter(
    (f) => f.status === "pending" && f.senderId === userId,
  );

  return {
    friendships,
    accepted,
    pendingReceived,
    pendingSent,
    loading,
    sendRequest,
    accept,
    reject,
    remove,
    searchUser,
    reload: load,
  };
}
