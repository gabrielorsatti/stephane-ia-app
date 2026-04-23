import { useCallback, useEffect, useRef, useState } from "react";
import { getAdapter, makeId } from "../lib/storage";
import type { Gym, LocationType } from "../types";

const KEY_CACHE = "stephane-ia:gyms:v1"; // cache local-first (toujours écrit)
const KEY_FAVORITE = "stephane-ia:favorite-gym:v1";
const EVT_GYMS = "stephane-ia:gyms-changed";
const EVT_FAVORITE = "stephane-ia:favorite-gym-changed";

function readCache(): Gym[] {
  try {
    const raw = localStorage.getItem(KEY_CACHE);
    return raw ? (JSON.parse(raw) as Gym[]) : [];
  } catch {
    return [];
  }
}

function writeCache(list: Gym[]): void {
  try {
    localStorage.setItem(KEY_CACHE, JSON.stringify(list));
  } catch {}
}

// Local-first : la source de vérité pour l'UI est localStorage. Supabase est
// un miroir asynchrone. Ce design tue les "clignotements" (optimistic →
// refetch null → réapparition) et garantit que le favori survit à toute
// latence réseau.
export function useGyms() {
  const [gyms, setGyms] = useState<Gym[]>(() => readCache());
  const [favoriteId, setFavoriteIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY_FAVORITE);
    } catch {
      return null;
    }
  });
  // Lock "écriture en cours" : tant qu'il est true, on ignore les refetchs
  // qui pourraient écraser un state optimiste avec une valeur BDD pas encore
  // cohérente. Un ref évite les re-renders inutiles.
  const savingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (savingRef.current) {
        console.info("[useGyms] load skipped (write in progress)");
        return;
      }
      try {
        const fresh = await getAdapter().getGyms();
        if (cancelled) return;
        // Fallback : si la BDD renvoie vide alors que le cache a du contenu
        // ET qu'on n'est pas authentifié sur le cloud, on garde le cache.
        // Sinon Supabase fait autorité.
        if (fresh.length === 0 && readCache().length > 0) {
          // Écart détecté : on priorise le cache (cas fréquent au démarrage
          // avant que Supabase ait synchronisé, ou si la table n'existe pas
          // encore côté DB).
          console.info("[useGyms] Empty DB response, keeping local cache");
          return;
        }
        setGyms(fresh);
        writeCache(fresh);
      } catch (err) {
        console.warn("[useGyms] Load failed, keeping cache", err);
      }
    }
    function onFavorite(e: Event) {
      const id = (e as CustomEvent<string | null>).detail ?? null;
      setFavoriteIdState(id);
    }
    void load();
    window.addEventListener("stephane-ia:storage-changed", load);
    window.addEventListener(EVT_GYMS, load);
    window.addEventListener(EVT_FAVORITE, onFavorite);
    return () => {
      cancelled = true;
      window.removeEventListener("stephane-ia:storage-changed", load);
      window.removeEventListener(EVT_GYMS, load);
      window.removeEventListener(EVT_FAVORITE, onFavorite);
    };
  }, []);

  const persist = useCallback(async (next: Gym[]) => {
    savingRef.current = true;
    // 1. Cache local synchrone — vérité UI garantie.
    setGyms(next);
    writeCache(next);
    console.info("[useGyms] Gym state updated", { count: next.length });
    try {
      // 2. Sync BDD en arrière-plan.
      await getAdapter().saveGyms(next);
      console.info("[useGyms] Gym saved to DB");
      window.dispatchEvent(new CustomEvent(EVT_GYMS));
    } catch (err) {
      console.error("[useGyms] DB save failed (cache kept)", err);
    } finally {
      // Léger délai avant de libérer le lock : laisse le temps aux listeners
      // asynchrones (Supabase real-time, événements navigateur) de drainer.
      setTimeout(() => {
        savingRef.current = false;
      }, 300);
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
    console.info("[useGyms] Favorite updated", { id });
    window.dispatchEvent(new CustomEvent(EVT_FAVORITE, { detail: id }));
  }, []);

  const favorite = favoriteId ? gyms.find((g) => g.id === favoriteId) : undefined;

  return { gyms, addGym, updateGym, removeGym, favoriteId, favorite, setFavorite };
}
