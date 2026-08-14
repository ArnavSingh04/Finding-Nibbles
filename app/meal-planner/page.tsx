"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { toast } from "react-toastify";

import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { MealType } from "@/lib/models";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { GradientButton } from "@/components/ui/GradientButton";
import { useConfirm } from "@/components/ui/ConfirmDialog";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const LIMITS = {
  calories: { min: 0, max: 10000 },
  protein: { min: 0, max: 1000 },
  carbs: { min: 0, max: 1000 },
  fat: { min: 0, max: 1000 },
} as const;

// Series colours pulled from the theme tokens (kept in sync with globals.css).
const SERIES = {
  calories: "var(--terracotta)",
  protein: "var(--basil)",
  carbs: "var(--honey)",
  fat: "var(--paprika)",
} as const;

// Chart axis / grid / tooltip colours read from CSS variables so they stay
// legible in both light and dark mode.
const CHART_INK = "var(--text-muted)";
const CHART_GRID = "var(--border)";

type Field = "date" | "meal" | "calories" | "protein" | "fat" | "carbs";

const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");
const clamp = (n: number, lim: { min: number; max: number }) =>
  Math.max(lim.min, Math.min(lim.max, n));

function isNumberInRange(n: number, { min, max }: { min: number; max: number }) {
  return Number.isFinite(n) && n >= min && n <= max;
}

/** Format a Date to dd/mm/yyyy (the storage format used throughout). */
function toDdMmYyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Format a Date to yyyy-mm-dd for a native date <input>. */
function toIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Parse dd/mm/yyyy -> Date (local, midnight) or null when invalid. */
function parseDdMmYyyy(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return d.getFullYear() === Number(yyyy) &&
    d.getMonth() === Number(mm) - 1 &&
    d.getDate() === Number(dd)
    ? d
    : null;
}

/** Parse the native input's yyyy-mm-dd into a local Date (avoids UTC shift). */
function parseIsoDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [, yyyy, mm, dd] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sixMonthsAgo(): Date {
  const d = startOfToday();
  d.setMonth(d.getMonth() - 6);
  return d;
}

/** Sum a numeric meal field, treating null/NaN as 0. */
function sumField(meals: MealType[], field: "calories" | "protein" | "carbs" | "fat") {
  return meals.reduce((total, m) => {
    const v = m[field];
    return total + (typeof v === "number" && Number.isFinite(v) ? v : 0);
  }, 0);
}

// ---------------------------------------------------------------------------
// Progress bar for "consumed vs goal"
// ---------------------------------------------------------------------------

function GoalBar({
  label,
  consumed,
  goal,
  unit,
  color,
}: {
  label: string;
  consumed: number;
  goal: number | null;
  unit: string;
  color: string;
}) {
  const hasGoal = goal != null && goal > 0;
  const pct = hasGoal ? Math.min(100, Math.round((consumed / goal!) * 100)) : 0;
  const over = hasGoal && consumed > goal!;

  return (
    <div className="card-surface p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-[var(--text)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--text-muted)]">
          {Math.round(consumed)}
          {hasGoal ? ` / ${goal}` : ""} {unit}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: hasGoal ? `${pct}%` : "0%",
            backgroundColor: over ? "var(--paprika)" : color,
          }}
        />
      </div>
      <div className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
        {hasGoal ? (over ? `${Math.round(consumed - goal!)} ${unit} over goal` : `${pct}% of goal`) : "No goal set"}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Themed chart tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface px-3 py-2 text-sm shadow-[var(--shadow-md)]">
      <div className="mb-1 font-bold text-[var(--text)]">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[var(--text-muted)]">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="capitalize">{p.name}:</span>
          <span className="font-semibold text-[var(--text)]">
            {p.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MealPlannerPage() {
  const { user, isLoggedIn, refetch: refetchUser } = useCurrentUser();
  const { confirm, dialog } = useConfirm();
  const {
    data: meals = [],
    loading: mealsLoading,
    error: mealsError,
    refetch,
  } = useResource(() => api.meals.list(), []);

  // Live goals (drive charts + progress bars). null == not set.
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
  const [proteinGoal, setProteinGoal] = useState<number | null>(null);
  const [carbGoal, setCarbGoal] = useState<number | null>(null);
  const [fatGoal, setFatGoal] = useState<number | null>(null);

  // Selected day (defaults to today).
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfToday());

  // Dialog state
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Goal draft values (strings, edited inside dialog)
  const [calorieDraft, setCalorieDraft] = useState("");
  const [proteinDraft, setProteinDraft] = useState("");
  const [carbDraft, setCarbDraft] = useState("");
  const [fatDraft, setFatDraft] = useState("");

  // Add-meal form
  const [mealName, setMealName] = useState("");
  const [caloriesInput, setCaloriesInput] = useState("");
  const [proteinInput, setProteinInput] = useState("");
  const [fatInput, setFatInput] = useState("");
  const [carbsInput, setCarbsInput] = useState("");

  // Seed live goals from the user profile once available.
  const initialized = React.useRef(false);
  useEffect(() => {
    if (initialized.current || !user) return;
    if (user.profile?.calorieGoal != null) setCalorieGoal(user.profile.calorieGoal);
    if (user.profile?.macroGoals) {
      setProteinGoal(user.profile.macroGoals.protein ?? null);
      setCarbGoal(user.profile.macroGoals.carbs ?? null);
      setFatGoal(user.profile.macroGoals.fat ?? null);
    }
    initialized.current = true;
  }, [user]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const selectedDateStr = toDdMmYyyy(selectedDate);

  const mealsForDay = useMemo(
    () => meals.filter((m) => m.date === selectedDateStr),
    [meals, selectedDateStr]
  );

  const totals = useMemo(
    () => ({
      calories: sumField(mealsForDay, "calories"),
      protein: sumField(mealsForDay, "protein"),
      carbs: sumField(mealsForDay, "carbs"),
      fat: sumField(mealsForDay, "fat"),
    }),
    [mealsForDay]
  );

  // Sorted chronologically for the trend charts.
  const sortedMeals = useMemo(() => {
    return [...meals].sort((a, b) => {
      const da = parseDdMmYyyy(a.date)?.getTime() ?? 0;
      const db = parseDdMmYyyy(b.date)?.getTime() ?? 0;
      return da - db;
    });
  }, [meals]);

  const calorieChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const { date, calories } of sortedMeals) {
      if (typeof calories === "number" && Number.isFinite(calories)) {
        map.set(date, (map.get(date) ?? 0) + calories);
      }
    }
    return Array.from(map.entries()).map(([name, calories]) => ({ name, calories }));
  }, [sortedMeals]);

  const macroChartData = useMemo(() => {
    const map = new Map<string, { protein: number; carbs: number; fat: number }>();
    for (const { date, protein, carbs, fat } of sortedMeals) {
      const e = map.get(date) ?? { protein: 0, carbs: 0, fat: 0 };
      if (typeof protein === "number" && Number.isFinite(protein)) e.protein += protein;
      if (typeof carbs === "number" && Number.isFinite(carbs)) e.carbs += carbs;
      if (typeof fat === "number" && Number.isFinite(fat)) e.fat += fat;
      map.set(date, e);
    }
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
  }, [sortedMeals]);

  // -------------------------------------------------------------------------
  // Date navigation
  // -------------------------------------------------------------------------

  const shiftDay = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      next.setHours(0, 0, 0, 0);
      return next;
    });
  };

  const isToday = selectedDateStr === toDdMmYyyy(startOfToday());
  const canGoForward = !isToday; // never past today

  // -------------------------------------------------------------------------
  // Goals dialog
  // -------------------------------------------------------------------------

  const openGoalsDialog = () => {
    setCalorieDraft(calorieGoal != null ? String(calorieGoal) : "");
    setProteinDraft(proteinGoal != null ? String(proteinGoal) : "");
    setCarbDraft(carbGoal != null ? String(carbGoal) : "");
    setFatDraft(fatGoal != null ? String(fatGoal) : "");
    setGoalDialogOpen(true);
  };

  const handleSaveGoals = async () => {
    if (!isLoggedIn || !user) {
      toast.error("Please sign in to save your goals.");
      return;
    }
    const cal = Number(calorieDraft);
    const p = Number(proteinDraft);
    const c = Number(carbDraft);
    const f = Number(fatDraft);

    if ([calorieDraft, proteinDraft, carbDraft, fatDraft].some((s) => s.trim() === "")) {
      toast.error("Please fill in all four goals.");
      return;
    }
    if (
      !isNumberInRange(cal, LIMITS.calories) ||
      !isNumberInRange(p, LIMITS.protein) ||
      !isNumberInRange(c, LIMITS.carbs) ||
      !isNumberInRange(f, LIMITS.fat)
    ) {
      toast.error(
        `Enter valid numbers: calories 0–${LIMITS.calories.max}, macros 0–${LIMITS.protein.max} g.`
      );
      return;
    }

    setSaving(true);
    try {
      await api.users.updateCalorieGoal(cal);
      await api.users.updateMacroGoals({ protein: p, carbs: c, fat: f });
      setCalorieGoal(cal);
      setProteinGoal(p);
      setCarbGoal(c);
      setFatGoal(f);
      setGoalDialogOpen(false);
      await refetchUser();
      toast.success("Goals updated.");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't save your goals.");
    } finally {
      setSaving(false);
    }
  };

  const digitField = (raw: string, lim: { min: number; max: number }) => {
    const stripped = onlyDigits(raw);
    if (stripped === "") return "";
    return String(clamp(Number(stripped), lim));
  };

  // -------------------------------------------------------------------------
  // Add meal
  // -------------------------------------------------------------------------

  const openAddDialog = () => {
    setMealName("");
    setCaloriesInput("");
    setProteinInput("");
    setFatInput("");
    setCarbsInput("");
    setAddOpen(true);
  };

  const handleAddMeal = async () => {
    const name = mealName.trim();

    if (!name) {
      toast.error("Give your meal a name.");
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      toast.error("Meal name can only contain letters and spaces.");
      return;
    }
    if (name.length > 100) {
      toast.error("That meal name is too long.");
      return;
    }

    // Date must be valid, not in the future, and within the past 6 months.
    if (parseDdMmYyyy(selectedDateStr) == null) {
      toast.error("Please pick a valid date.");
      return;
    }
    if (selectedDate > startOfToday()) {
      toast.error("You can't log meals for a future date.");
      return;
    }
    if (selectedDate < sixMonthsAgo()) {
      toast.error("Pick a date within the last 6 months.");
      return;
    }

    // Empty inputs become null; otherwise parse and range-check.
    const toNumOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
    const calN = toNumOrNull(caloriesInput);
    const proN = toNumOrNull(proteinInput);
    const fatN = toNumOrNull(fatInput);
    const carbN = toNumOrNull(carbsInput);

    // Guard against NaN and out-of-range values.
    const outOfRange =
      (calN != null && !isNumberInRange(calN, LIMITS.calories)) ||
      (proN != null && !isNumberInRange(proN, LIMITS.protein)) ||
      (fatN != null && !isNumberInRange(fatN, LIMITS.fat)) ||
      (carbN != null && !isNumberInRange(carbN, LIMITS.carbs));

    if (outOfRange) {
      toast.error("One of the nutrition values is out of range.");
      return;
    }
    if (calN == null && proN == null && fatN == null && carbN == null) {
      toast.error("Add at least one nutrition value (calories or a macro).");
      return;
    }

    setSaving(true);
    try {
      await api.meals.insert({
        date: selectedDateStr,
        meal: name,
        calories: calN,
        protein: proN,
        fat: fatN,
        carbs: carbN,
      });
      setAddOpen(false);
      await refetch();
      toast.success(`Logged “${name}”.`);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't log that meal.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (meal: MealType) => {
    const ok = await confirm({
      title: "Delete this meal?",
      message: `“${meal.meal}” will be removed from ${meal.date}.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.meals.remove(meal._id!);
      await refetch();
      toast.success("Meal deleted.");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't delete that meal.");
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Meal planner"
        title="Track today, hit your goals"
        subtitle="Log what you eat, watch your macros, and keep an eye on the bigger picture."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outlined"
              startIcon={<TuneRoundedIcon />}
              onClick={openGoalsDialog}
            >
              Set goals
            </Button>
            <GradientButton startIcon={<AddRoundedIcon />} onClick={openAddDialog}>
              Log a meal
            </GradientButton>
          </div>
        }
      />

      {/* Day picker */}
      <div className="card-surface mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <IconButton onClick={() => shiftDay(-1)} aria-label="Previous day" size="small">
            <ChevronLeftRoundedIcon />
          </IconButton>
          <input
            type="date"
            value={toIsoDate(selectedDate)}
            max={toIsoDate(startOfToday())}
            onChange={(e) => {
              const d = parseIsoDate(e.target.value);
              if (d) {
                d.setHours(0, 0, 0, 0);
                setSelectedDate(d);
              }
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--terracotta)]"
          />
          <IconButton
            onClick={() => shiftDay(1)}
            aria-label="Next day"
            size="small"
            disabled={!canGoForward}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </div>
        <div className="font-display text-lg font-bold text-[var(--text)]">
          {isToday ? "Today" : selectedDateStr}
        </div>
      </div>

      {/* Progress vs goal */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GoalBar
          label="Calories"
          consumed={totals.calories}
          goal={calorieGoal}
          unit="kcal"
          color={SERIES.calories}
        />
        <GoalBar
          label="Protein"
          consumed={totals.protein}
          goal={proteinGoal}
          unit="g"
          color={SERIES.protein}
        />
        <GoalBar
          label="Carbs"
          consumed={totals.carbs}
          goal={carbGoal}
          unit="g"
          color={SERIES.carbs}
        />
        <GoalBar
          label="Fat"
          consumed={totals.fat}
          goal={fatGoal}
          unit="g"
          color={SERIES.fat}
        />
      </div>

      {/* Meals for the day */}
      <section className="mb-10">
        <h2 className="font-display mb-4 text-xl font-bold text-[var(--text)]">
          {isToday ? "Today's meals" : `Meals on ${selectedDateStr}`}
        </h2>

        {mealsLoading ? (
          <LoadingState label="Loading your meals…" />
        ) : mealsError ? (
          <EmptyState
            emoji="😕"
            title="Couldn't load your meals"
            message={mealsError.message}
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : mealsForDay.length === 0 ? (
          <EmptyState
            emoji="🍽️"
            title="Nothing logged yet"
            message={
              isToday
                ? "Add your first meal of the day to start tracking."
                : "No meals recorded for this day. Pick another date or log one."
            }
            action={
              <GradientButton startIcon={<AddRoundedIcon />} onClick={openAddDialog}>
                Log a meal
              </GradientButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mealsForDay.map((meal) => (
              <div key={meal._id} className="card-surface flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display min-w-0 break-words text-lg font-bold text-[var(--text)]">
                    {meal.meal}
                  </h3>
                  <IconButton
                    onClick={() => handleDeleteMeal(meal)}
                    aria-label={`Delete ${meal.meal}`}
                    size="small"
                    sx={{ color: "var(--paprika)" }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MealStat label="Calories" value={meal.calories} unit="kcal" />
                  <MealStat label="Protein" value={meal.protein} unit="g" />
                  <MealStat label="Carbs" value={meal.carbs} unit="g" />
                  <MealStat label="Fat" value={meal.fat} unit="g" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trends */}
      {!mealsLoading && !mealsError && meals.length > 0 && (
        <section className="space-y-8">
          <h2 className="font-display text-xl font-bold text-[var(--text)]">Trends over time</h2>

          <ChartPanel title="Daily calories">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={calorieChartData} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: CHART_INK, fontSize: 12 }} stroke={CHART_GRID} />
                <YAxis tick={{ fill: CHART_INK, fontSize: 12 }} stroke={CHART_GRID} />
                <Tooltip content={<ChartTooltip unit="kcal" />} />
                {calorieGoal != null && calorieGoal > 0 && (
                  <ReferenceLine
                    y={calorieGoal}
                    stroke={SERIES.calories}
                    strokeDasharray="5 5"
                    label={{ value: "Goal", fill: CHART_INK, fontSize: 11, position: "right" }}
                    ifOverflow="extendDomain"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="calories"
                  name="Calories"
                  stroke={SERIES.calories}
                  strokeWidth={3}
                  dot={{ r: 3, fill: SERIES.calories }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Macros">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={macroChartData} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: CHART_INK, fontSize: 12 }} stroke={CHART_GRID} />
                <YAxis tick={{ fill: CHART_INK, fontSize: 12 }} stroke={CHART_GRID} />
                <Tooltip content={<ChartTooltip unit="g" />} />
                <Line
                  type="monotone"
                  dataKey="protein"
                  name="Protein"
                  stroke={SERIES.protein}
                  strokeWidth={3}
                  dot={{ r: 3, fill: SERIES.protein }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="carbs"
                  name="Carbs"
                  stroke={SERIES.carbs}
                  strokeWidth={3}
                  dot={{ r: 3, fill: SERIES.carbs }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="fat"
                  name="Fat"
                  stroke={SERIES.fat}
                  strokeWidth={3}
                  dot={{ r: 3, fill: SERIES.fat }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[var(--text-muted)]">
              <LegendDot color={SERIES.protein} label="Protein" />
              <LegendDot color={SERIES.carbs} label="Carbs" />
              <LegendDot color={SERIES.fat} label="Fat" />
            </div>
          </ChartPanel>
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Add meal dialog */}
      {/* ------------------------------------------------------------------- */}
      <Dialog
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Log a meal for {isToday ? "today" : selectedDateStr}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Meal name"
            value={mealName}
            onChange={(e) => setMealName(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Calories"
              value={caloriesInput}
              onChange={(v) => setCaloriesInput(digitField(v, LIMITS.calories))}
            />
            <NumField
              label="Protein (g)"
              value={proteinInput}
              onChange={(v) => setProteinInput(digitField(v, LIMITS.protein))}
            />
            <NumField
              label="Carbs (g)"
              value={carbsInput}
              onChange={(v) => setCarbsInput(digitField(v, LIMITS.carbs))}
            />
            <NumField
              label="Fat (g)"
              value={fatInput}
              onChange={(v) => setFatInput(digitField(v, LIMITS.fat))}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button color="inherit" onClick={() => setAddOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <GradientButton onClick={handleAddMeal} disabled={saving}>
            {saving ? "Logging…" : "Log meal"}
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------------- */}
      {/* Set goals dialog */}
      {/* ------------------------------------------------------------------- */}
      <Dialog
        open={goalDialogOpen}
        onClose={() => !saving && setGoalDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Set your daily goals</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <NumField
            label="Target daily calories"
            value={calorieDraft}
            onChange={(v) => setCalorieDraft(digitField(v, LIMITS.calories))}
            sx={{ mt: 1 }}
          />
          <NumField
            label="Protein (g)"
            value={proteinDraft}
            onChange={(v) => setProteinDraft(digitField(v, LIMITS.protein))}
          />
          <NumField
            label="Carbs (g)"
            value={carbDraft}
            onChange={(v) => setCarbDraft(digitField(v, LIMITS.carbs))}
          />
          <NumField
            label="Fat (g)"
            value={fatDraft}
            onChange={(v) => setFatDraft(digitField(v, LIMITS.fat))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button color="inherit" onClick={() => setGoalDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <GradientButton onClick={handleSaveGoals} disabled={saving}>
            {saving ? "Saving…" : "Save goals"}
          </GradientButton>
        </DialogActions>
      </Dialog>

      {dialog}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function MealStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-sunset-soft px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
      <div className="font-bold text-[var(--text)]">
        {value != null ? `${value} ${unit}` : "—"}
      </div>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5">
      <h3 className="font-display mb-4 text-base font-bold text-[var(--text)]">{title}</h3>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function NumField({
  label,
  value,
  onChange,
  sx,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  sx?: object;
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type="text"
      inputMode="numeric"
      fullWidth
      sx={sx}
      slotProps={{
        htmlInput: {
          pattern: "[0-9]*",
          onWheel: (ev: any) => ev.currentTarget.blur(),
        },
      }}
    />
  );
}
