"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import Slider from "@mui/material/Slider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import { api, type DishSuggestion } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { MOCK_DISHES } from "@/lib/mockData";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { GradientButton } from "@/components/ui/GradientButton";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { DietBadge, Tag, type DietKey } from "@/components/ui/DietBadge";

const DIET_KEYS: DietKey[] = ["vegetarian", "vegan", "glutenFree", "dairyFree", "halal"];

// Internal card shape - carries the rich AI fields through the pipeline.
type Dish = {
  id: number;
  name: string;
  image: string;
  description: string;
  cuisine?: string;
  why?: string;
  nutrition?: DishSuggestion["nutrition"];
  dietary?: DishSuggestion["dietary"];
};

/** today's date as dd/mm/yyyy - matches MealType.date format. */
function todayKey() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Swipeable dish card surfacing the enriched AI data.
const DishCard = ({
  dish,
  onSwipe,
  badge,
  onAddToPlan,
}: {
  dish: Dish;
  onSwipe: (action: "like" | "dislike") => void;
  badge?: "liked" | "disliked";
  onAddToPlan?: (dish: Dish) => void | Promise<void>;
}) => {
  const [exitX, setExitX] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSwipe = (action: "like" | "dislike") => {
    setExitX(action === "like" ? 240 : -240);
    onSwipe(action);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("dislike"),
    onSwipedRight: () => handleSwipe("like"),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  const dietary = DIET_KEYS.filter((k) => dish.dietary?.[k]);
  const n = dish.nutrition;

  const handleAdd = async () => {
    if (!onAddToPlan) return;
    setAdding(true);
    try {
      await onAddToPlan(dish);
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      {...swipeHandlers}
      key={dish.id}
      className="card-surface mx-auto flex w-full max-w-md touch-pan-y flex-col overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: exitX }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {imageError || !dish.image ? (
        <div className="grid h-56 w-full place-items-center bg-sunset-soft text-4xl" aria-hidden>
          🍽️
        </div>
      ) : (
        <img
          src={dish.image}
          alt={dish.name}
          className="h-56 w-full object-cover"
          onError={() => setImageError(true)}
          draggable={false}
        />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-bold text-[var(--text)]">{dish.name}</h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {dish.cuisine && <Tag>{dish.cuisine}</Tag>}
            {badge && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  badge === "liked"
                    ? "bg-[var(--basil)]/10 text-[var(--basil)]"
                    : "bg-[var(--paprika)]/10 text-[var(--paprika)]"
                }`}
              >
                {badge === "liked" ? "Liked" : "Passed"}
              </span>
            )}
          </div>
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
            🔥 {n.calories} kcal · P {n.protein ?? "-"}g · C {n.carbs ?? "-"}g · F {n.fat ?? "-"}g
          </div>
        )}

        {onAddToPlan && (
          <Button
            className="!mt-4"
            variant="outlined"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "Adding…" : "Add to meal plan"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] p-4">
        <button
          onClick={() => handleSwipe("dislike")}
          className="flex h-14 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] font-bold text-[var(--paprika)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
          aria-label="Dislike"
        >
          <ThumbDownAltRoundedIcon /> Pass
        </button>
        <button
          onClick={() => handleSwipe("like")}
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-sunset font-bold text-white shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
          aria-label="Like"
        >
          <ThumbUpAltRoundedIcon /> Like
        </button>
      </div>
    </motion.div>
  );
};

function SectionShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export default function DiscoverPage() {
  const { user } = useCurrentUser();
  const { confirm, dialog } = useConfirm();

  const [liked, setLiked] = useState<Dish[]>([]);
  const [disliked, setDisliked] = useState<Dish[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [diversity, setDiversity] = useState<number>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("discover_diversity") : null;
    const parsed = stored != null ? Number(stored) : NaN;
    return Number.isFinite(parsed) ? parsed : 50;
  });

  const [tryNewQueue, setTryNewQueue] = useState<Dish[]>([]);
  const [usedMockFirst, setUsedMockFirst] = useState(false);
  const [recommendedQueue, setRecommendedQueue] = useState<Dish[]>([]);
  const [currentTryNew, setCurrentTryNew] = useState<Dish | null>(null);
  const [currentRecommended, setCurrentRecommended] = useState<Dish | null>(null);
  const [recommendedAvoid, setRecommendedAvoid] = useState<string[]>([]);
  const [tryNewAvoid, setTryNewAvoid] = useState<string[]>([]);

  const [tryNewLoading, setTryNewLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [tryNewError, setTryNewError] = useState("");
  const [recommendedError, setRecommendedError] = useState("");

  const [clearing, setClearing] = useState(false);

  const [occasionLoading, setOccasionLoading] = useState(false);
  const [occasionError, setOccasionError] = useState("");
  const [occasionMenu, setOccasionMenu] = useState<{
    centerpiece: Dish | null;
    complements: Dish[];
  }>({ centerpiece: null, complements: [] });
  const [occasion, setOccasion] = useState<string>(() => {
    const s = typeof window !== "undefined" ? window.localStorage.getItem("discover_occasion") : null;
    return s || "";
  });
  const [diningMode, setDiningMode] = useState<"out" | "home">(() => {
    const s = typeof window !== "undefined" ? window.localStorage.getItem("discover_diningMode") : null;
    return s === "out" || s === "home" ? s : "out";
  });
  const [vibe, setVibe] = useState<string>(() => {
    const s = typeof window !== "undefined" ? window.localStorage.getItem("discover_vibe") : null;
    return s || "";
  });

  // Map an AI DishSuggestion onto our internal Dish, preserving rich fields.
  const toDish = (d: DishSuggestion & { image?: string }): Dish => ({
    id: Date.now() + Math.random(),
    name: d.name,
    description: d.description,
    image: d.image ?? "",
    cuisine: d.cuisine,
    why: d.why,
    nutrition: d.nutrition,
    dietary: d.dietary,
  });

  useEffect(() => {
    (async () => {
      try {
        const likedDishes = await api.dishes.getUserPreferences();
        const prefs =
          likedDishes && likedDishes.length > 0 ? likedDishes : user?.profile?.preferences || [];
        setPreferences(prefs);
        prefetchSuggestions(
          { mode: "recommended", preferences: prefs.join(",") },
          setRecommendedQueue,
          setCurrentRecommended,
          setRecommendedLoading,
          setRecommendedError
        );
      } catch {
        const prefs = user?.profile?.preferences || [];
        setPreferences(prefs);
        prefetchSuggestions(
          { mode: "recommended", preferences: prefs.join(",") },
          setRecommendedQueue,
          setCurrentRecommended,
          setRecommendedLoading,
          setRecommendedError
        );
      }
    })();

    prefetchSuggestions(
      { mode: "tryNew", diversity },
      setTryNewQueue,
      setCurrentTryNew,
      setTryNewLoading,
      setTryNewError
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist controls across sessions
  useEffect(() => {
    try {
      window.localStorage.setItem("discover_diversity", String(diversity));
    } catch {}
  }, [diversity]);
  useEffect(() => {
    try {
      window.localStorage.setItem("discover_occasion", occasion);
    } catch {}
  }, [occasion]);
  useEffect(() => {
    try {
      window.localStorage.setItem("discover_diningMode", diningMode);
    } catch {}
  }, [diningMode]);
  useEffect(() => {
    try {
      window.localStorage.setItem("discover_vibe", vibe);
    } catch {}
  }, [vibe]);

  const prefetchSuggestions = async (
    params: Record<string, any>,
    setQueue: React.Dispatch<React.SetStateAction<Dish[]>>,
    setCurrent: React.Dispatch<React.SetStateAction<Dish | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setLoading(true);
    setError("");

    // First "Try New" render is seeded with instant local mock dishes.
    if (params.mode === "tryNew" && !usedMockFirst) {
      const seeded = MOCK_DISHES.map((d) =>
        toDish({ name: d.name, description: d.description, image: d.imageUrl })
      );
      setQueue(seeded);
      setCurrent(seeded[0] ?? null);
      setUsedMockFirst(true);
      setLoading(false);
      return;
    }

    try {
      const data = await api.ai.suggest({
        ...params,
        avoid: params.mode === "tryNew" ? tryNewAvoid : recommendedAvoid,
        userId: user?._id,
      });
      const dishes = (data.dishes || []) as DishSuggestion[];
      if (!Array.isArray(dishes) || dishes.length === 0) throw new Error("No dishes returned");

      // Generate images in parallel; keep the rich AI fields.
      const enriched = await Promise.all(
        dishes.slice(0, 5).map(async (d) => {
          try {
            const imageData = await api.ai.generateImage(d.name);
            const image = imageData.image
              ? `data:image/png;base64,${imageData.image}`
              : imageData.imageUrl || "";
            return toDish({ ...d, image });
          } catch {
            return toDish({ ...d, image: "" });
          }
        })
      );

      setQueue(enriched);
      setCurrent(enriched[0] ?? null);
      const seenNames = enriched.map((d) => d.name);
      if (params.mode === "recommended") {
        setRecommendedAvoid((prev) => [...prev, ...seenNames].slice(-100));
      } else if (params.mode === "tryNew") {
        setTryNewAvoid((prev) => [...prev, ...seenNames].slice(-100));
      }
    } catch {
      setError("We couldn't reach the AI kitchen. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOccasionMenu = async () => {
    if (!occasion) {
      toast.info("Pick an occasion first.");
      return;
    }
    setOccasionLoading(true);
    setOccasionError("");
    try {
      const data = await api.ai.suggest({
        mode: "occasion",
        occasion,
        diningMode,
        vibe,
        userId: user?._id,
      });
      const menu = data.menu as {
        centerpiece: DishSuggestion;
        complements: DishSuggestion[];
      };
      const all = [menu.centerpiece, ...(menu.complements ?? [])];
      const withImages = await Promise.all(
        all.map(async (d) => {
          try {
            const imageData = await api.ai.generateImage(d.name);
            const image = imageData.image
              ? `data:image/png;base64,${imageData.image}`
              : imageData.imageUrl || "";
            return toDish({ ...d, image });
          } catch {
            return toDish({ ...d, image: "" });
          }
        })
      );
      const [centerpiece, ...complements] = withImages;
      setOccasionMenu({ centerpiece: centerpiece ?? null, complements });
    } catch {
      setOccasionError("Couldn't build an occasion menu. Try again.");
    } finally {
      setOccasionLoading(false);
    }
  };

  const clearHistory = async () => {
    if (clearing) return;
    const ok = await confirm({
      title: "Clear your dish history?",
      message: "This removes your likes and passes so recommendations start fresh. This can't be undone.",
      confirmLabel: "Clear history",
      destructive: true,
    });
    if (!ok) return;

    setClearing(true);
    try {
      const res = await api.dishes.clearHistory();
      setLiked([]);
      setDisliked([]);
      setRecommendedAvoid([]);
      setTryNewAvoid([]);
      toast.success(`Cleared history (${res?.deletedCount ?? 0} removed).`);
    } catch (e: any) {
      toast.error(e?.message || "Could not clear history. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const addToMealPlan = async (dish: Dish) => {
    try {
      await api.meals.insert({
        date: todayKey(),
        meal: dish.name,
        calories: dish.nutrition?.calories ?? null,
        protein: dish.nutrition?.protein ?? null,
        fat: dish.nutrition?.fat ?? null,
        carbs: dish.nutrition?.carbs ?? null,
      });
      toast.success(`Added "${dish.name}" to today's meal plan`);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't add to meal plan");
    }
  };

  const handlePreference = (action: "like" | "dislike", dish: Dish | null) => {
    if (!dish) return;
    if (action === "like") setLiked((prev) => [...prev, dish]);
    if (action === "dislike") setDisliked((prev) => [...prev, dish]);
    api.dishes.swipe(dish.name, action === "like").catch(() => {});
  };

  const handleSwipeFromQueue = (
    action: "like" | "dislike",
    queue: Dish[],
    setQueue: React.Dispatch<React.SetStateAction<Dish[]>>,
    current: Dish | null,
    setCurrent: React.Dispatch<React.SetStateAction<Dish | null>>,
    prefetchParams: Record<string, any>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>
  ) => {
    handlePreference(action, current);
    const [, ...rest] = queue;
    if (rest.length === 0) {
      prefetchSuggestions(prefetchParams, setQueue, setCurrent, setLoading, setError);
    } else {
      setQueue(rest);
      setCurrent(rest[0]);
    }
  };

  const badgeFor = (dish: Dish | null) => {
    if (!dish) return undefined;
    if (liked.some((d) => d.name === dish.name)) return "liked" as const;
    if (disliked.some((d) => d.name === dish.name)) return "disliked" as const;
    return undefined;
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Discover"
        title={
          <>
            Find your next <span className="text-gradient">favourite dish</span>
          </>
        }
        subtitle="Swipe to teach us your taste. Like a card to save it, or add it straight to today's meal plan."
      />

      {/* Try New */}
      <SectionShell
        title="Try something new"
        subtitle="Dishes just outside your usual - dial the adventure up or down."
        action={
          <Button
            variant="outlined"
            size="small"
            onClick={clearHistory}
            disabled={clearing}
          >
            {clearing ? "Clearing…" : "Clear history"}
          </Button>
        }
      >
        <div className="card-surface mb-5 flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-bold text-[var(--text-muted)]">Classic</span>
          <Slider
            value={diversity}
            onChange={(_, v) => setDiversity(v as number)}
            min={0}
            max={100}
            valueLabelDisplay="auto"
            aria-label="Diversity"
            sx={{ flex: 1, color: "var(--terracotta)" }}
          />
          <span className="text-sm font-bold text-[var(--text-muted)]">Adventurous</span>
        </div>

        {tryNewLoading && !currentTryNew ? (
          <LoadingState label="Finding something new…" />
        ) : tryNewError && !currentTryNew ? (
          <EmptyState
            emoji="😕"
            title="Couldn't load dishes"
            message={tryNewError}
            action={
              <GradientButton
                onClick={() =>
                  prefetchSuggestions(
                    { mode: "tryNew", diversity },
                    setTryNewQueue,
                    setCurrentTryNew,
                    setTryNewLoading,
                    setTryNewError
                  )
                }
              >
                Try again
              </GradientButton>
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            {currentTryNew && (
              <DishCard
                key={currentTryNew.id}
                dish={currentTryNew}
                badge={badgeFor(currentTryNew)}
                onAddToPlan={addToMealPlan}
                onSwipe={(action) =>
                  handleSwipeFromQueue(
                    action,
                    tryNewQueue,
                    setTryNewQueue,
                    currentTryNew,
                    setCurrentTryNew,
                    { mode: "tryNew", diversity },
                    setTryNewLoading,
                    setTryNewError
                  )
                }
              />
            )}
          </AnimatePresence>
        )}
      </SectionShell>

      {/* Recommended */}
      <SectionShell
        title="Recommended for you"
        subtitle="Picked from the flavours you've liked so far."
      >
        {recommendedLoading && !currentRecommended ? (
          <LoadingState label="Matching your taste…" />
        ) : recommendedError && !currentRecommended ? (
          <EmptyState
            emoji="😕"
            title="Couldn't load recommendations"
            message={recommendedError}
            action={
              <GradientButton
                onClick={() =>
                  prefetchSuggestions(
                    { mode: "recommended", preferences: preferences.join(",") },
                    setRecommendedQueue,
                    setCurrentRecommended,
                    setRecommendedLoading,
                    setRecommendedError
                  )
                }
              >
                Try again
              </GradientButton>
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            {currentRecommended && (
              <DishCard
                key={currentRecommended.id}
                dish={currentRecommended}
                badge={badgeFor(currentRecommended)}
                onAddToPlan={addToMealPlan}
                onSwipe={(action) =>
                  handleSwipeFromQueue(
                    action,
                    recommendedQueue,
                    setRecommendedQueue,
                    currentRecommended,
                    setCurrentRecommended,
                    { mode: "recommended", preferences: preferences.join(",") },
                    setRecommendedLoading,
                    setRecommendedError
                  )
                }
              />
            )}
          </AnimatePresence>
        )}
      </SectionShell>

      {/* Special Occasion */}
      <SectionShell
        title="Special occasion"
        subtitle="Build a centrepiece and complements for the moment."
      >
        <div className="card-surface p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {["Birthday", "Anniversary", "Date night", "Family dinner", "Friends gathering"].map((o) => {
              const active = occasion === o;
              return (
                <button
                  key={o}
                  onClick={() => setOccasion(o)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                    active
                      ? "border-transparent bg-sunset text-white shadow-[var(--shadow-sm)]"
                      : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex overflow-hidden rounded-full border border-[var(--border)]">
              <button
                onClick={() => setDiningMode("out")}
                className={`px-4 py-1.5 text-sm font-bold transition ${
                  diningMode === "out" ? "bg-sunset text-white" : "bg-[var(--bg)] text-[var(--text-muted)]"
                }`}
              >
                Dining out
              </button>
              <button
                onClick={() => setDiningMode("home")}
                className={`px-4 py-1.5 text-sm font-bold transition ${
                  diningMode === "home" ? "bg-sunset text-white" : "bg-[var(--bg)] text-[var(--text-muted)]"
                }`}
              >
                At home
              </button>
            </div>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="vibe-label">Vibe</InputLabel>
              <Select
                labelId="vibe-label"
                label="Vibe"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
              >
                <MenuItem value="">Any vibe</MenuItem>
                <MenuItem value="Cozy">Cozy</MenuItem>
                <MenuItem value="Fancy">Fancy</MenuItem>
                <MenuItem value="Fun">Fun</MenuItem>
              </Select>
            </FormControl>

            <GradientButton
              className="sm:ml-auto"
              startIcon={<CelebrationRoundedIcon />}
              onClick={fetchOccasionMenu}
              disabled={occasionLoading}
            >
              {occasionLoading ? "Building…" : "Get occasion menu"}
            </GradientButton>
          </div>

          {occasionLoading ? (
            <LoadingState label="Setting the table…" />
          ) : occasionError ? (
            <EmptyState
              emoji="😕"
              title="Couldn't build the menu"
              message={occasionError}
              action={<GradientButton onClick={fetchOccasionMenu}>Try again</GradientButton>}
            />
          ) : occasionMenu.centerpiece ? (
            <div>
              <h3 className="mb-3 font-display text-lg font-bold text-[var(--text)]">Centrepiece</h3>
              <DishCard dish={occasionMenu.centerpiece} onSwipe={() => {}} onAddToPlan={addToMealPlan} />
              {occasionMenu.complements.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 font-display text-base font-bold text-[var(--text)]">Complements</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {occasionMenu.complements.map((d) => (
                      <DishCard key={d.id} dish={d} onSwipe={() => {}} onAddToPlan={addToMealPlan} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              emoji="🎉"
              title="Plan the perfect spread"
              message="Pick an occasion and vibe, then get a centrepiece with complements."
            />
          )}
        </div>
      </SectionShell>

      {dialog}
    </PageContainer>
  );
}
