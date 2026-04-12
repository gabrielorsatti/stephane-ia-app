import type {
  BodyWeightEntry,
  PersonalRecordOverride,
  Session,
} from "../types";

// Abstraction de stockage. Actuellement adossée au LocalStorage mais prête
// à être remplacée par une API SQLite/PostgreSQL : il suffit d'implémenter
// la même interface `StorageAdapter` et de l'injecter à la place.

export interface StorageAdapter {
  getSessions(): Promise<Session[]>;
  saveSessions(sessions: Session[]): Promise<void>;
  getBodyWeights(): Promise<BodyWeightEntry[]>;
  saveBodyWeights(entries: BodyWeightEntry[]): Promise<void>;
}

const KEY_SESSIONS = "gym-tracker:sessions:v1";
const KEY_BW = "gym-tracker:bodyweight:v1";
const KEY_OVERRIDES = "gym-tracker:pr-overrides:v1";

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
};

// Helper : génère un id unique simple.
export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
