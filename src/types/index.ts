// Catégories d'exercices utilisées pour le regroupement et les stats.
export type Category =
  | "Poussée"
  | "Tirage"
  | "Jambes"
  | "Épaules"
  | "Bras"
  | "Abdos"
  | "Pliométrie"
  | "Power Training"
  | "Cardio"
  | "Cours Collectif"
  | "Mobilité"
  | "Autre";

export const ALL_CATEGORIES: Category[] = [
  "Poussée",
  "Tirage",
  "Jambes",
  "Épaules",
  "Bras",
  "Abdos",
  "Pliométrie",
  "Power Training",
  "Cardio",
  "Cours Collectif",
  "Mobilité",
  "Autre",
];

export interface SetEntry {
  reps: number;
  // kg. Pour les exercices au poids du corps, ce champ représente le LEST
  // (charge ajoutée) : 0 = PDC seul, 20 = tractions +20 kg à la ceinture.
  // Pour les exercices strength, c'est la charge absolue sur la barre/machine.
  poids: number;
}

// Champ optionnel pour le cardio : distance (km), durée (min), dénivelé (m).
// Renseigné sur un ExerciseEntry de catégorie "Cardio" en plus (ou à la place)
// des séries reps/poids. L'allure (min/km) est calculée à la volée depuis
// distance + duree — pas stockée pour garder la source de vérité unique.
export interface CardioData {
  distance?: number;
  duree?: number;
  denivele?: number;
}

export type Intensity = "léger" | "modéré" | "intense";

export interface ExerciseEntry {
  nom: string;
  categorie: Category;
  sets: SetEntry[];
  cardio?: CardioData;
  durationMinutes?: number;
  intensity?: Intensity;
  comment?: string;
}

export interface Session {
  id: string;
  date: string; // ISO yyyy-mm-dd
  exercices: ExerciseEntry[];
  notes?: string;
  bodyWeight?: number;
  createdAt?: string; // ISO timestamp — used for smart session merging
  startedAt?: string; // ISO timestamp — live session start
  durationSeconds?: number; // elapsed wall-clock time
  coachCommentary?: string;
  isPublished?: boolean;
  userComment?: string;
  publishedAt?: string; // ISO timestamp
}

export interface FeedPost {
  session: Session;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  authorLevel?: number;
  likeCount: number;
  likedByMe: boolean;
  comments: FeedComment[];
}

export interface FeedComment {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface BodyWeightEntry {
  date: string; // ISO
  poids: number;
}

export type LocationType = "city_center" | "suburban" | "business_district";
export const LOCATION_TYPES: LocationType[] = [
  "city_center",
  "suburban",
  "business_district",
];

export interface Gym {
  id: string;
  name: string;
  brand?: string;
  locationType?: LocationType;
  createdAt: string;
}

export type OccupancyLevel = "vide" | "moyen" | "bonde";

export interface OccupancyFeedback {
  id: string;
  gymId: string;
  hour: number; // 0-23
  dayOfWeek: number; // 0=dim, 6=sam
  level: OccupancyLevel;
  createdAt: string;
}

// Repas/snack enregistré côté nutrition. `foodText` est la saisie libre
// originale ; les 4 macros sont extraites par l'IA (ou estimées).
export interface NutritionLog {
  id: string;
  date: string; // ISO yyyy-mm-dd
  foodText: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string; // ISO timestamp — sert au tri intra-journée
}

// ───────── Social / profils ─────────

export interface Profile {
  id: string; // auth.users.id
  username: string;
  avatarUrl?: string;
  bio?: string;
  totalXp: number;
  weeklyGoal?: number;
  isAdmin: boolean;
  createdAt: string;
}

export type FriendshipStatus = "pending" | "accepted";

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendshipStatus;
  createdAt: string;
  senderUsername?: string;
  receiverUsername?: string;
  senderAvatarUrl?: string;
  receiverAvatarUrl?: string;
}

// ───────── Notifications ─────────

export type NotificationType = "like" | "comment";

export interface AppNotification {
  id: string;
  userId: string;
  actorId: string;
  actorUsername?: string;
  actorAvatarUrl?: string;
  type: NotificationType;
  sessionId: string;
  isRead: boolean;
  createdAt: string;
}

export interface PublicStats {
  totalSessions: number;
  totalVolume: number;
  topExercises: Array<{ nom: string; count: number }>;
  memberSince: string; // ISO
}

// ───────── Records ─────────

// Surcharge manuelle des PR pour un exercice donné. Tous les champs sont
// optionnels : ceux qui sont renseignés remplacent la valeur calculée à
// partir des séances, les autres restent déduits automatiquement.
export interface PersonalRecordOverride {
  nom: string;
  categorie?: Category;
  maxPoids?: number;
  maxPoidsReps?: number;
  maxPoidsDate?: string;
  best1RM?: number;
  best1RMDate?: string;
  // Records spécifiques aux exercices bodyweight : meilleure série sans lest
  // (maxReps à poids 0) — complète maxPoids qui représente alors le record lesté.
  maxRepsBodyweight?: number;
  maxRepsBodyweightDate?: string;
  notes?: string;
}
