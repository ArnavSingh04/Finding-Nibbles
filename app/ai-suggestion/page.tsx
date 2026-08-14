"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { api, type DishSuggestion } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { GradientButton } from "@/components/ui/GradientButton";
import { DietBadge, Tag, type DietKey } from "@/components/ui/DietBadge";

const DIET_KEYS: DietKey[] = ["vegetarian", "vegan", "glutenFree", "dairyFree", "halal"];

const OCCASIONS = [
  { value: "birthday", label: "Birthday" },
  { value: "date night", label: "Date night" },
  { value: "holiday", label: "Holiday" },
  { value: "family dinner", label: "Family dinner" },
  { value: "celebration", label: "Celebration" },
];

/** today's date as dd/mm/yyyy — matches MealType.date format. */
function todayKey() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

type SuggestedDish = DishSuggestion & { image?: string };

function DishResultCard({ dish }: { dish: SuggestedDish }) {
  const [imageError, setImageError] = useState(false);
  const [adding, setAdding] = useState(false);
  const dietary = DIET_KEYS.filter((k) => dish.dietary?.[k]);
  const n = dish.nutrition;

  const addToMealPlan = async () => {
    setAdding(true);
    try {
      await api.meals.insert({
        date: todayKey(),
        meal: dish.name,
        calories: n?.calories ?? null,
        protein: n?.protein ?? null,
        fat: n?.fat ?? null,
        carbs: n?.carbs ?? null,
      });
      toast.success(`Added "${dish.name}" to today's meal plan`);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't add to meal plan");
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="card-surface flex flex-col overflow-hidden animate-fade-in-up">
      {dish.image && !imageError ? (
        <img
          src={dish.image}
          alt={dish.name}
          onError={() => setImageError(true)}
          className="h-56 w-full object-cover"
        />
      ) : (
        <div className="grid h-56 w-full place-items-center bg-sunset-soft text-4xl" aria-hidden>
          🍽️
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-bold text-[var(--text)]">{dish.name}</h3>
          {dish.cuisine && <Tag>{dish.cuisine}</Tag>}
        </div>

        <p className="text-sm text-[var(--text-muted)]">{dish.description}</p>

        {dish.why && (
          <p className="mt-3 rounded-xl bg-sunset-soft px-3 py-2 text-sm font-semibold text-[var(--terracotta-strong)]">
            ✨ {dish.why}
          </p>
        )}

        {dietary.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {dietary.map((k) => (
              <DietBadge key={k} diet={k} />
            ))}
          </div>
        )}

        {n?.calories != null && (
          <div className="mt-3 border-t border-[var(--border)] pt-3 text-xs font-bold text-[var(--text-muted)]">
            🔥 {n.calories} kcal · P {n.protein ?? "—"}g · C {n.carbs ?? "—"}g · F {n.fat ?? "—"}g
          </div>
        )}

        <div className="mt-4 flex-1" />
        <Button
          variant="outlined"
          fullWidth
          startIcon={<AddRoundedIcon />}
          onClick={addToMealPlan}
          disabled={adding}
        >
          {adding ? "Adding…" : "Add to meal plan"}
        </Button>
      </div>
    </article>
  );
}

export default function AiSuggestionPage() {
  const { user } = useCurrentUser();
  const [dishes, setDishes] = useState<SuggestedDish[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("birthday");
  const [preferences, setPreferences] = useState<string[]>([]);

  useEffect(() => {
    if (user?.profile?.preferences) {
      setPreferences(user.profile.preferences);
    }
  }, [user]);

  const fetchSuggestion = async (params: Record<string, unknown> = {}): Promise<void> => {
    setLoading(true);
    setError("");
    setDishes(null);

    try {
      const data = await api.ai.suggest({ ...params, userId: user?._id });

      // Normalise both "dishes" and "menu" shapes into a flat list.
      let list: DishSuggestion[] = [];
      if (data.menu) {
        const { centerpiece, complements } = data.menu as {
          centerpiece: DishSuggestion;
          complements?: DishSuggestion[];
        };
        list = [centerpiece, ...(complements ?? [])].filter(Boolean);
      } else if (data.dishes?.length) {
        list = data.dishes;
      }

      if (list.length === 0) {
        setDishes([]);
        return;
      }

      // Generate images in parallel, degrading gracefully on failure.
      const withImages = await Promise.all(
        list.map(async (d) => {
          try {
            const img = await api.ai.generateImage(d.name);
            const image = img.image ? `data:image/png;base64,${img.image}` : img.imageUrl || "";
            return { ...d, image };
          } catch {
            return { ...d, image: "" };
          }
        })
      );

      setDishes(withImages);
    } catch (err: any) {
      setError(err?.message || "Couldn't get a suggestion. Please try again.");
      setDishes(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="AI powered"
        title={
          <>
            AI dish <span className="text-gradient">suggestions</span>
          </>
        }
        subtitle="Tell us the vibe and we'll plate up ideas — with the why, the macros, and one tap to add them to today's plan."
        action={
          <GradientButton
            startIcon={<AutoAwesomeRoundedIcon />}
            onClick={() => fetchSuggestion({ mode: "recommended", preferences: preferences.join(",") })}
            disabled={loading}
          >
            Surprise me
          </GradientButton>
        }
      />

      {/* Controls */}
      <div className="card-surface mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="occasion-label">Occasion</InputLabel>
            <Select
              labelId="occasion-label"
              label="Occasion"
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              disabled={loading}
            >
              {OCCASIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<CelebrationRoundedIcon />}
            onClick={() => fetchSuggestion({ occasion: selectedOccasion, mode: "occasion" })}
            disabled={loading}
          >
            Get occasion menu
          </Button>
        </div>
        <Button
          variant="outlined"
          onClick={() => fetchSuggestion({ preferences: preferences.join(",") })}
          disabled={loading}
        >
          Can&rsquo;t decide? Use my taste
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingState label="Plating up ideas…" />
      ) : error ? (
        <EmptyState
          emoji="😕"
          title="Couldn't get a suggestion"
          message={error}
          action={
            <GradientButton onClick={() => fetchSuggestion({ mode: "recommended", preferences: preferences.join(",") })}>
              Try again
            </GradientButton>
          }
        />
      ) : dishes === null ? (
        <EmptyState
          emoji="🍳"
          title="Hungry for ideas?"
          message="Pick an occasion or hit Surprise me to get AI dish suggestions tailored to your taste."
          action={
            <GradientButton
              startIcon={<AutoAwesomeRoundedIcon />}
              onClick={() => fetchSuggestion({ mode: "recommended", preferences: preferences.join(",") })}
            >
              Surprise me
            </GradientButton>
          }
        />
      ) : dishes.length === 0 ? (
        <EmptyState
          emoji="🤔"
          title="No dishes this time"
          message="The kitchen came up empty. Try a different occasion or roll again."
          action={
            <GradientButton onClick={() => fetchSuggestion({ mode: "recommended", preferences: preferences.join(",") })}>
              Try again
            </GradientButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((d, i) => (
            <DishResultCard key={`${d.name}-${i}`} dish={d} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
