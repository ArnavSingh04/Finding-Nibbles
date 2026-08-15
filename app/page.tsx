"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import { api, type DishSuggestion } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatCard } from "@/components/ui/StatCard";
import { DietBadge, Tag, type DietKey } from "@/components/ui/DietBadge";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const QUICK_ACTIONS = [
  { href: "/map?dice=1", icon: CasinoRoundedIcon, title: "Roll the dice", body: "Let the map pick a cuisine", accent: true },
  { href: "/map", icon: MapRoundedIcon, title: "Find nearby", body: "Restaurants around you" },
  { href: "/meal-planner", icon: RestaurantMenuRoundedIcon, title: "Log a meal", body: "Track today's food" },
  { href: "/travel-plans", icon: LuggageRoundedIcon, title: "Plan a trip", body: "Build a food itinerary" },
];

const DIET_KEYS: DietKey[] = ["vegetarian", "vegan", "glutenFree", "dairyFree", "halal"];

export default function Dashboard() {
  const { userName, user } = useCurrentUser();
  const { data: meals = [] } = useResource(() => api.meals.list(), []);
  const { data: savedRestaurants = [] } = useResource(() => api.savedRestaurants.list(), []);
  const { data: plans = [] } = useResource(() => api.plans.list(), []);
  const { data: history = [] } = useResource(() => api.searchHistory.list(), []);

  const [picks, setPicks] = useState<DishSuggestion[] | null>(null);
  useEffect(() => {
    let active = true;
    api.ai
      .suggest({ mode: "recommended", diversity: 55 })
      .then((r) => active && setPicks(r.dishes ?? []))
      .catch(() => active && setPicks([]));
    return () => {
      active = false;
    };
  }, []);

  const today = todayKey();
  const caloriesToday = meals
    .filter((m) => m.date === today)
    .reduce((sum, m) => sum + (m.calories ?? 0), 0);
  const goal = user?.profile?.calorieGoal;
  const recentSearches = history.slice(0, 6);

  return (
    <PageContainer>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-[var(--text)] sm:text-4xl">
          {greeting()}, <span className="text-gradient">{userName}</span> 👋
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">Here&rsquo;s what&rsquo;s on the menu today.</p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className={`group card-surface flex flex-col gap-3 p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)] ${
                a.accent ? "bg-sunset-soft" : ""
              }`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sunset text-white shadow-[var(--shadow-sm)]">
                <Icon />
              </span>
              <div>
                <div className="font-display font-bold text-[var(--text)]">{a.title}</div>
                <div className="text-sm text-[var(--text-muted)]">{a.body}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          emoji="🔥"
          value={goal ? `${caloriesToday}` : caloriesToday || "-"}
          label="Calories today"
          hint={goal ? `of ${goal} goal` : "Set a goal in Profile"}
        />
        <StatCard emoji="❤️" value={savedRestaurants.length} label="Saved restaurants" />
        <StatCard emoji="🧳" value={plans.length} label="Trips planned" />
        <StatCard emoji="🔎" value={history.length} label="Searches made" />
      </div>

      {/* Today's picks */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">Today&rsquo;s picks</h2>
          <p className="text-sm text-[var(--text-muted)]">AI-chosen for your taste. Want more? Head to Discover.</p>
        </div>
        <Link href="/discover" className="hidden shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--text)] hover:shadow-[var(--shadow-sm)] sm:block">
          More picks →
        </Link>
      </div>

      {picks === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-surface h-44 animate-pulse" aria-hidden />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {picks.slice(0, 3).map((d, i) => (
            <article key={`${d.name}-${i}`} className="card-surface flex flex-col p-5 animate-fade-in-up">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-[var(--text)]">{d.name}</h3>
                {d.cuisine && <Tag>{d.cuisine}</Tag>}
              </div>
              <p className="text-sm text-[var(--text-muted)]">{d.description}</p>
              {d.why && (
                <p className="mt-3 rounded-xl bg-sunset-soft px-3 py-2 text-sm font-semibold text-[var(--terracotta-strong)]">
                  ✨ {d.why}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.dietary &&
                  DIET_KEYS.filter((k) => d.dietary?.[k]).map((k) => <DietBadge key={k} diet={k} />)}
              </div>
              {d.nutrition?.calories != null && (
                <div className="mt-3 border-t border-[var(--border)] pt-3 text-xs font-bold text-[var(--text-muted)]">
                  🔥 {d.nutrition.calories} kcal · P {d.nutrition.protein ?? "-"}g · C {d.nutrition.carbs ?? "-"}g · F {d.nutrition.fat ?? "-"}g
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-xl font-extrabold text-[var(--text)]">Jump back in</h2>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <Link
                key={s._id}
                href="/map"
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--text)] hover:shadow-[var(--shadow-sm)]"
              >
                🔎 {s.searchTerm}
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
