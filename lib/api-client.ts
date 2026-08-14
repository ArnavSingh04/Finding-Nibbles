/**
 * Typed browser-side API client. Replaces `Meteor.call(...)`.
 *
 * Every function performs a fetch against the Next.js Route Handlers under
 * /api and throws an Error (with the server's message) on non-2xx responses.
 */

import type {
  ISavedRestaurant,
  ISearchHistory,
  MealType,
  PlanType,
  ISavedDish,
} from "./models";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

const get = <T>(url: string) => request<T>(url);
const post = <T>(url: string, body?: unknown) =>
  request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const put = <T>(url: string, body?: unknown) =>
  request<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
const del = <T>(url: string, body?: unknown) =>
  request<T>(url, { method: "DELETE", body: body ? JSON.stringify(body) : undefined });

export interface UserProfile {
  _id: string;
  username: string;
  profile: {
    name?: string;
    preferences?: string[];
    profileImage?: string;
    calorieGoal?: number;
    macroGoals?: { protein: number; fat: number; carbs: number };
    swipeOnboardingCompleted?: boolean;
  };
}

export interface DishSuggestion {
  name: string;
  description: string;
  imageUrl?: string;
}

export const api = {
  auth: {
    register: (username: string, email: string, password: string, name?: string) =>
      post<{ ok: boolean }>("/api/auth/register", { username, email, password, name }),
  },

  users: {
    me: () => get<UserProfile>("/api/users/me"),
    updateProfile: (name: string, email: string, preferences: string[]) =>
      post<{ ok: boolean }>("/api/users/profile", { name, email, preferences }),
    uploadProfileImage: (file: { name: string; type: string; size: number; data: string }) =>
      post<{ success: boolean; message: string }>("/api/users/profile-image", file),
    updateCalorieGoal: (calorieGoal: number) =>
      post<{ ok: boolean }>("/api/users/calorie-goal", { calorieGoal }),
    updateMacroGoals: (macroGoals: { protein: number; fat: number; carbs: number }) =>
      post<{ ok: boolean }>("/api/users/macro-goals", { macroGoals }),
    changePassword: (currentPassword: string, newPassword: string) =>
      post<{ ok: boolean }>("/api/users/password", { currentPassword, newPassword }),
  },

  dishes: {
    swipe: (name: string, liked: boolean) =>
      post<{ ok: boolean }>("/api/dishes/swipe", { name, liked }),
    getUserPreferences: () => get<string[]>("/api/dishes/preferences"),
    getUserFeedback: () =>
      get<{ likes: string[]; dislikes: string[]; recentSearches: string[] }>(
        "/api/dishes/feedback"
      ),
    clearHistory: () => del<{ deletedCount: number }>("/api/dishes/history"),
  },

  onboarding: {
    getSwipeCompleted: () => get<{ completed: boolean }>("/api/onboarding/swipe"),
    setSwipeCompleted: () => post<{ ok: number }>("/api/onboarding/swipe"),
  },

  ai: {
    suggest: (payload: Record<string, unknown>) =>
      post<{ dishes?: DishSuggestion[]; menu?: any }>("/api/ai-suggestion", payload),
    generateImage: (prompt: string) =>
      post<{ image?: string; imageUrl?: string }>("/api/generate-image", { prompt }),
  },

  searchHistory: {
    list: () => get<ISearchHistory[]>("/api/search-history"),
    save: (searchTerm: string) => post<{ ok: number }>("/api/search-history", { searchTerm }),
    remove: (searchTerm: string) =>
      del<{ deletedCount: number }>("/api/search-history", { searchTerm }),
  },

  savedRestaurants: {
    list: () => get<ISavedRestaurant[]>("/api/saved-restaurants"),
    save: (restaurant: Partial<ISavedRestaurant>) =>
      post<{ _id: string }>("/api/saved-restaurants", restaurant),
    remove: (placeId: string) =>
      del<{ deletedCount: number }>("/api/saved-restaurants", { placeId }),
  },

  plans: {
    list: () => get<PlanType[]>("/api/plans"),
    get: (planId: string) => get<PlanType>(`/api/plans/${planId}`),
    insert: (input: {
      title: string;
      startingPoint?: string;
      destination?: string;
      tripStartDate?: string | Date | null;
    }) => post<{ _id: string }>("/api/plans", input),
    addRestaurant: (planId: string, restaurant: any) =>
      post<{ ok: number }>(`/api/plans/${planId}/restaurants`, { restaurant }),
    update: (
      planId: string,
      input: {
        title: string;
        restaurants: any[];
        startingPoint?: string;
        destination?: string;
        tripStartDate?: string | Date | null;
      }
    ) => put<{ ok: number }>(`/api/plans/${planId}`, input),
    remove: (planId: string) => del<{ ok: number }>(`/api/plans/${planId}`),
  },

  meals: {
    list: () => get<MealType[]>("/api/meals"),
    insert: (meal: Omit<MealType, "_id" | "userId">) =>
      post<{ _id: string }>("/api/meals", meal),
    remove: (mealId: string) => del<{ ok: number }>(`/api/meals/${mealId}`),
  },

  savedDishes: {
    list: () => get<ISavedDish[]>("/api/saved-dishes"),
    add: (name: string, city: string) =>
      post<{ _id: string }>("/api/saved-dishes", { name, city }),
    remove: (dishId: string) => del<{ ok: number }>(`/api/saved-dishes/${dishId}`),
  },
};

export type Api = typeof api;
