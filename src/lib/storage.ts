import type {
  BodyWeightEntry,
  NutritionLog,
  PersonalRecordOverride,
  Session,
} from "../types";
import { supabaseAdapter } from "./adapters/supabaseAdapter";
import { getSupabase } from "./supabase";

// Abstraction de stockage. Actuellement adossée au LocalStorage mais prête
// à être remplacée par une API SQLite/PostgreSQL : il suffit d'implémenter
// la même interface `StorageAdapter` et de l'injecter à la place.

export interface StorageAdapter {
  getSessions(): Promise<Session[]>;
  saveSessions(sessions: Session[]): Promise<void>;
  getBodyWeights(): Promise<BodyWeightEntry[]>;
  saveBodyWeights(entries: BodyWeightEntry[]): Promise<void>;
  getNutritionLogs(): Promise<NutritionLog[]>;
  saveNutritionLogs(logs: NutritionLog[]): Promise<void>;
  getRecordOverrides(): Promise<PersonalRecordOverride[]>;
  saveRecordOverrides(overrides: PersonalRecordOverride[]): Promise<void>;
}

const KEY_SESSIONS = "gym-tracker:sessions:v1";
const KEY_BW = "gym-tracker:bodyweight:v1";
const KEY_OVERRIDES = "gym-tracker:pr-overrides:v1";
const KEY_NUTRITION = "gym-tracker:nutrition:v1";

// Les PR overrides restent volontairement découplés de StorageAdapter pour
// l'instant : ils sont une préférence utilisateur, pas une donnée source.
export const recordOverridesStore = {
  async get(): Promise<PersonalRecordOverride[]> {
    try {
      const raw = localStorage.getItem(KEY_OVERRIDES);
      return raw ? (JSON.parse(raw) as PersonalRecordOverride[]) : [];
    } catch {
      return [];
    }
  },
  async save(list: PersonalRecordOverride[]): Promise<void> {
    localStorage.setItem(KEY_OVERRIDES, JSON.stringify(list));
  },
};

export const localStorageAdapter: StorageAdapter = {
  async getSessions() {
    try {
      const raw = localStorage.getItem(KEY_SESSIONS);
      return raw ? (JSON.parse(raw) as Session[]) : [];
    } catch {
      return [];
    }
  },
  async saveSessions(sessions) {
    localStorage.setItem(KEY_SESSIONS, JSON.stringify(sessions));
  },
  async getBodyWeights() {
    try {
      const raw = localStorage.getItem(KEY_BW);
      return raw ? (JSON.parse(raw) as BodyWeightEntry[]) : [];
    } catch {
      return [];
    }
  },
  async saveBodyWeights(entries) {
    localStorage.setItem(KEY_BW, JSON.stringify(entries));
  },
  async getNutritionLogs() {
    try {
      const raw = localStorage.getItem(KEY_NUTRITION);
      return raw ? (JSON.parse(raw) as NutritionLog[]) : [];
    } catch {
      return [];
    }
  },
  async saveNutritionLogs(logs) {
    localStorage.setItem(KEY_NUTRITION, JSON.stringify(logs));
  },
  async getRecordOverrides() {
    return recordOverridesStore.get();
  },
  async saveRecordOverrides(overrides) {
    return recordOverridesStore.save(overrides);
  },
};

// Helper : génère un id unique simple.
export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Sélecteur dynamique : si Supabase est configuré ET l'utilisateur connecté,
// on route vers le cloud. Sinon fallback LocalStorage (mode solo offline).
// L'appel à getUser() est async, donc on ruse : quand on passe en mode cloud,
// on pose un flag synchrone mis à jour par les listeners onAuthStateChange.
let cloudEnabled = false;
export function setCloudMode(enabled: boolean): void {
  cloudEnabled = enabled;
  // Notifie les hooks qu'ils doivent re-fetcher depuis la nouvelle source.
  window.dispatchEvent(new CustomEvent("gym-tracker:storage-changed"));
}

export function getAdapter(): StorageAdapter {
  if (cloudEnabled) {
    const client = getSupabase();
    if (client) return supabaseAdapter(client);
  }
  return localStorageAdapter;
}

// Helper test-only : force LocalStorage (utile pour migrer local → cloud).
export function getLocalAdapter(): StorageAdapter {
  return localStorageAdapter;
}
