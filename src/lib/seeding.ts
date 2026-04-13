import { SEED_BODY_WEIGHTS, SEED_SESSIONS } from "../data/seed";
import { localStorageAdapter } from "./storage";

// Marqueur posé en LocalStorage après un seed réussi : empêche un second
// remplissage involontaire, même si l'utilisateur vide ensuite ses données.
const FLAG_KEY = "gym-tracker:seeded:v1";

// Initialise le LocalStorage avec les données de démarrage si (et seulement
// si) aucune séance n'est déjà stockée et que le marqueur est absent.
// Retourne true si un seed a été appliqué.
export async function seedIfEmpty(): Promise<boolean> {
  if (localStorage.getItem(FLAG_KEY)) {
    await ensureHardcodedSeeds();
    return false;
  }
  const [sessions, bw] = await Promise.all([
    localStorageAdapter.getSessions(),
    localStorageAdapter.getBodyWeights(),
  ]);
  if (sessions.length > 0 || bw.length > 0) {
    localStorage.setItem(FLAG_KEY, "1");
    await ensureHardcodedSeeds();
    return false;
  }
  await localStorageAdapter.saveSessions(SEED_SESSIONS);
  await localStorageAdapter.saveBodyWeights(SEED_BODY_WEIGHTS);
  localStorage.setItem(FLAG_KEY, "1");
  return true;
}

// Complète le LocalStorage avec les séances seed "hardcodées" qui ne sont
// pas encore présentes (matching par id). Ne touche à rien d'autre, donc
// les séances éditées / supprimées manuellement par l'utilisateur ne sont
// pas ressuscitées — seules les nouvelles entrées ajoutées au seed au fil
// des versions sont injectées.
async function ensureHardcodedSeeds(): Promise<void> {
  const existing = await localStorageAdapter.getSessions();
  const existingIds = new Set(existing.map((s) => s.id));
  const missing = SEED_SESSIONS.filter((s) => !existingIds.has(s.id));
  if (!missing.length) return;
  await localStorageAdapter.saveSessions([...existing, ...missing]);
}

// Utilitaire : force le seed (remplace les données actuelles). Réservé au
// bouton "Réinitialiser avec mes données" dans l'UI.
export async function forceReseed(): Promise<void> {
  await localStorageAdapter.saveSessions(SEED_SESSIONS);
  await localStorageAdapter.saveBodyWeights(SEED_BODY_WEIGHTS);
  localStorage.setItem(FLAG_KEY, "1");
}
