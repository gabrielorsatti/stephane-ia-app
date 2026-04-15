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

  const persist = useCallback((next: Gym[]) => {
    setGyms(next);
    void getAdapter().saveGyms(next);
    // Notifie les autres instances de useGyms (ex: App + OccupancyChart
    // vivent dans des arbres séparés et ne partagent pas leur state).
    window.dispatchEvent(new CustomEvent(EVT_GYMS));
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
      persist([...gyms, gym]);
      return gym;
    },
    [gyms, persist],
  );

  const updateGym = useCallback(
    (id: string, patch: Partial<Omit<Gym, "id" | "createdAt">>) => {
      persist(gyms.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    },
    [gyms, persist],
  );

  const removeGym = useCallback(
    (id: string) => {
      persist(gyms.filter((g) => g.id !== id));
      if (favoriteId === id) {
        try {
          localStorage.removeItem(KEY_FAVORITE);
        } catch {}
        setFavoriteIdState(null);
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
    window.dispatchEvent(
      new CustomEvent(EVT_FAVORITE, { detail: id }),
    );
  }, []);

  const favorite = favoriteId ? gyms.find((g) => g.id === favoriteId) : undefined;

  return { gyms, addGym, updateGym, removeGym, favoriteId, favorite, setFavorite };
}
