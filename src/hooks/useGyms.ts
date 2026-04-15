import { useCallback, useEffect, useState } from "react";
import { getAdapter, makeId } from "../lib/storage";
import type { Gym, LocationType } from "../types";

const KEY_FAVORITE = "gym-tracker:favorite-gym:v1";
const EVT_GYMS = "gym-tracker:gyms-changed";
const EVT_FAVORITE = "gym-tracker:favorite-gym-changed";

export function useGyms() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [favoriteId, setFavoriteIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY_FAVORITE);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancelled = false;
    function load() {
      getAdapter()
        .getGyms()
        .then((g) => {
          if (!cancelled) setGyms(g);
        })
        .catch(() => {});
    }
    function onFavorite(e: Event) {
      const id = (e as CustomEvent<string | null>).detail ?? null;
      setFavoriteIdState(id);
    }
    load();
    window.addEventListener("gym-tracker:storage-changed", load);
    window.addEventListener(EVT_GYMS, load);
    window.addEventListener(EVT_FAVORITE, onFavorite);
    return () => {
      cancelled = true;
      window.removeEventListener("gym-tracker:storage-changed", load);
      window.removeEventListener(EVT_GYMS, load);
      window.removeEventListener(EVT_FAVORITE, onFavorite);
    };
  }, []);

  const persist = useCallback(async (next: Gym[]) => {
    // Optimiste : on pose tout de suite l'état local pour que l'UI réagisse.
    setGyms(next);
    try {
      // IMPORTANT : await la persistance AVANT de broadcaster l'event.
      // Sinon les autres instances (et la nôtre via le listener) refetchent
      // depuis Supabase avant que l'upsert soit visible → race qui efface
      // la salle fraîchement ajoutée.
      await getAdapter().saveGyms(next);
      console.info("[useGyms] Gym saved to DB", { count: next.length });
      window.dispatchEvent(new CustomEvent(EVT_GYMS));
    } catch (err) {
      console.error("[useGyms] Save failed, reverting UI", err);
      // En cas d'échec, on recharge pour réaligner sur la vérité BDD.
      try {
        const fresh = await getAdapter().getGyms();
        setGyms(fresh);
      } catch {}
    }
  }, []);

  const addGym = useCallback(
    (input: { name: string; brand?: string; locationType?: LocationType }) => {
      const gym: Gym = {
        id: makeId(),
        name: input.name,
        brand: input.brand,
        locationType: input.locationType,
        createdAt: new Date().toISOString(),
      };
      void persist([...gyms, gym]);
      return gym;
    },
    [gyms, persist],
  );

  const updateGym = useCallback(
    (id: string, patch: Partial<Omit<Gym, "id" | "createdAt">>) => {
      void persist(gyms.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    },
    [gyms, persist],
  );

  const removeGym = useCallback(
    (id: string) => {
      void persist(gyms.filter((g) => g.id !== id));
      if (favoriteId === id) {
        try {
          localStorage.removeItem(KEY_FAVORITE);
        } catch {}
        setFavoriteIdState(null);
        window.dispatchEvent(
          new CustomEvent(EVT_FAVORITE, { detail: null }),
        );
      }
    },
    [gyms, persist, favoriteId],
  );

  const setFavorite = useCallback((id: string | null) => {
    try {
      if (id) localStorage.setItem(KEY_FAVORITE, id);
      else localStorage.removeItem(KEY_FAVORITE);
    } catch {}
    setFavoriteIdState(id);
    console.info("[useGyms] Gym state updated (favorite)", { id });
    window.dispatchEvent(
      new CustomEvent(EVT_FAVORITE, { detail: id }),
    );
  }, []);

  const favorite = favoriteId ? gyms.find((g) => g.id === favoriteId) : undefined;

  return { gyms, addGym, updateGym, removeGym, favoriteId, favorite, setFavorite };
}
