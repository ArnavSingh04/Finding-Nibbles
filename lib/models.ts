import { Collection, Document } from "mongodb";
import { getDb } from "./db";

/* ────────────────────────────────────────────────────────────
 * Domain interfaces (ported from the Meteor collections).
 * `_id` is stored as a string to preserve Meteor's random-id
 * behaviour and keep client code unchanged.
 * ──────────────────────────────────────────────────────────── */

export interface UserDoc {
  _id?: string;
  username: string;
  passwordHash: string;
  profile?: {
    name?: string;
    preferences?: string[];
    profileImage?: string;
    calorieGoal?: number;
    macroGoals?: { protein: number; fat: number; carbs: number };
    swipeOnboardingCompleted?: boolean;
  };
  createdAt: Date;
}

export interface FlavourProfile {
  sweet: number;
  salty: number;
  sour: number;
  bitter: number;
  umami: number;
  spicy: number;
}

export interface IFoodItem {
  _id?: string;
  name: string;
  restaurant?: string;
  image?: string;
  description: string;
  ingredients: string[];
  flavourProfile: FlavourProfile;
  cuisine: string;
  category: string;
  textures: string[];
  dietaryInfo: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    halal: boolean;
  };
  nutritionEstimate: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    isEstimated?: boolean;
  };
  createdAt?: Date;
  createdBy?: string;
}

export interface IUserPreference {
  _id?: string;
  userId: string;
  likedDishes: Array<{ dishId: string; dishName?: string; timestamp: Date; rating: number }>;
  dislikedDishes: Array<{ dishId: string; dishName?: string; timestamp: Date; rating: number }>;
  ingredientScores?: Record<string, number>;
  flavourPreferences?: FlavourProfile;
  avoidIngredients?: string[];
  dietaryRestrictions?: string[];
  updatedAt?: Date;
}

export interface IDishSwipe {
  _id?: string;
  userId: string;
  name: string;
  liked: boolean;
  createdAt: Date;
}

export interface ISearchHistory {
  _id?: string;
  userId: string;
  searchTerm: string;
  timestamp: Date;
  createdAt?: Date;
}

export interface ISavedRestaurant {
  _id?: string;
  userId: string;
  placeId: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  rating?: number | null;
  cuisine?: string[];
  createdAt?: Date;
}

export interface PlanType {
  _id?: string;
  userId: string;
  title: string;
  restaurants: any[];
  startingPoint?: string;
  destination?: string;
  tripStartDate?: Date | null;
}

export interface MealType {
  _id?: string;
  userId: string;
  date: string; // dd/mm/yyyy
  meal: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export interface ISavedDish {
  _id?: string;
  userId: string;
  name: string;
  city: string;
  createdAt?: Date;
}

/* ────────────────────────────────────────────────────────────
 * Typed collection accessors.
 * ──────────────────────────────────────────────────────────── */

async function coll<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

export const collections = {
  users: () => coll<UserDoc>("users"),
  foodItems: () => coll<IFoodItem>("foodItems"),
  userPreferences: () => coll<IUserPreference>("userPreferences"),
  dishSwipes: () => coll<IDishSwipe>("dishSwipes"),
  searchHistory: () => coll<ISearchHistory>("searchHistory"),
  savedRestaurants: () => coll<ISavedRestaurant>("savedRestaurants"),
  plans: () => coll<PlanType>("plans"),
  meals: () => coll<MealType>("meals"),
  savedDishes: () => coll<ISavedDish>("savedDishes"),
};

/**
 * Generate a Meteor-style 17-char alphanumeric id so existing client code that
 * treats `_id` as an opaque string keeps working.
 */
const ID_CHARS = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";
export function randomId(length = 17): string {
  let id = "";
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    id += ID_CHARS[bytes[i] % ID_CHARS.length];
  }
  return id;
}

let indexesEnsured = false;

/**
 * Create the indexes the Meteor server used to create on startup.
 * Called lazily (and idempotently) from route handlers.
 */
export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    const db = await getDb();
    await Promise.all([
      db.collection("users").createIndex({ username: 1 }, { unique: true }),
      db
        .collection("searchHistory")
        .createIndex({ userId: 1, searchTerm: 1 }, { unique: true, name: "userId_1_searchTerm_1" }),
      db.collection("searchHistory").createIndex({ userId: 1, timestamp: -1 }),
      db.collection("savedRestaurants").createIndex(
        { userId: 1, placeId: 1 },
        { unique: true, name: "userId_1_placeId_1", partialFilterExpression: { placeId: { $type: "string" } } }
      ),
      db.collection("savedRestaurants").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("savedDishes").createIndex({ userId: 1, name: 1, city: 1 }, { unique: true }),
      db.collection("dishSwipes").createIndex({ userId: 1, createdAt: -1 }),
    ]);
  } catch (err) {
    // Index creation is best-effort; log and continue.
    console.error("ensureIndexes error:", err);
    indexesEnsured = false;
  }
}
