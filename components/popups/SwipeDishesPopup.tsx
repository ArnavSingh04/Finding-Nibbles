"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { api } from "@/lib/api-client";
import { Tag } from "@/components/ui/DietBadge";

const originalDishes = [
  { name: "Margherita Pizza", image: "/images/Margherita_pizza.png", cuisine: "Italian" },
  { name: "Sushi", image: "/images/sushi.png", cuisine: "Japanese" },
  { name: "Tacos", image: "/images/tacos.png", cuisine: "Mexican" },
  { name: "Butter Chicken", image: "/images/butter_chicken.png", cuisine: "Indian" },
  { name: "Pad Thai", image: "/images/pad_thai.png", cuisine: "Thai" },
  { name: "Falafel", image: "/images/falafel.png", cuisine: "Middle Eastern" },
  { name: "Peking Duck", image: "/images/peking_duck.png", cuisine: "Chinese" },
  { name: "Croissant", image: "/images/Croissant.png", cuisine: "French" },
  { name: "Kimchi Jjigae", image: "/images/kimchi_jjigae.png", cuisine: "Korean" },
  { name: "Paella", image: "/images/Paella.png", cuisine: "Spanish" },
  { name: "Moussaka", image: "/images/Moussaka.png", cuisine: "Greek" },
  { name: "Jollof Rice", image: "/images/Jollof_rice.png", cuisine: "West African" },
  { name: "Pierogi", image: "/images/Pierogi.png", cuisine: "Polish" },
  { name: "Ceviche", image: "/images/Ceviche.png", cuisine: "Peruvian" },
  { name: "Tom Yum Soup", image: "/images/Tom_yum_soup.png", cuisine: "Thai" },
  { name: "Goulash", image: "/images/Goulash.png", cuisine: "Hungarian" },
  { name: "Chicken Shawarma", image: "/images/chicken_shawarma.png", cuisine: "Middle Eastern" },
  { name: "Fish and Chips", image: "/images/Fish_and_chips.png", cuisine: "British" },
  { name: "Empanadas", image: "/images/Empanadas.png", cuisine: "Argentinian" },
  { name: "Pho", image: "/images/Pho.png", cuisine: "Vietnamese" },
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type SwipeDishesPopupProps = { onClose: () => void };

const SwipeDishesPopup = ({ onClose }: SwipeDishesPopupProps) => {
  const [dishes, setDishes] = useState(originalDishes);
  const [index, setIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [exitX, setExitX] = useState(0);

  // Shuffle dishes on mount and auto-close if onboarding already completed
  useEffect(() => {
    setDishes(shuffleArray(originalDishes));
    (async () => {
      try {
        const completed = (await api.onboarding.getSwipeCompleted()).completed;
        if (completed) onClose();
      } catch {
        // Best-effort: if the check fails, keep the popup open so the user can still swipe.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwipe = (liked: boolean) => {
    const dish = dishes[index];
    setExitX(liked ? 240 : -240);
    setImageError(false);
    api.dishes.swipe(dish.name, liked).catch(() => {});
    // First successful swipe marks onboarding completed
    if (index === 0) {
      api.onboarding.setSwipeCompleted().catch(() => {});
    }
    if (index < dishes.length - 1) setIndex(index + 1);
    else onClose();
  };

  if (index >= dishes.length) return null;

  const dish = dishes[index];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="card-surface relative flex w-[360px] max-w-full flex-col items-center p-6 shadow-[var(--shadow-lg)] animate-fade-in-up">
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{ position: "absolute", top: 8, right: 8, color: "var(--text-muted)" }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <div className="mb-1 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[var(--paprika)]">
          <span className="h-1.5 w-1.5 rounded-full bg-sunset" />
          Tell us your taste
        </div>
        <p className="mb-4 text-center text-sm text-[var(--text-muted)]">
          Like the dishes you enjoy so we can tailor recommendations.
        </p>

        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={dish.name}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: exitX }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {imageError ? (
                <div className="mb-4 grid h-48 w-full place-items-center rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text-muted)]">
                  Image unavailable
                </div>
              ) : (
                <img
                  src={dish.image}
                  alt={dish.name}
                  onError={() => setImageError(true)}
                  className="mb-4 h-48 w-full rounded-2xl border border-[var(--border)] object-cover shadow-[var(--shadow-sm)]"
                />
              )}
              <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">{dish.name}</h2>
              <div className="mt-2">
                <Tag>{dish.cuisine}</Tag>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex gap-6">
          <button
            onClick={() => handleSwipe(false)}
            className="grid h-16 w-16 place-items-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-2xl text-[var(--paprika)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            aria-label="Dislike"
          >
            👎
          </button>
          <button
            onClick={() => handleSwipe(true)}
            className="grid h-16 w-16 place-items-center rounded-full bg-sunset text-2xl text-white shadow-[var(--shadow-md)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
            aria-label="Like"
          >
            👍
          </button>
        </div>
        <span className="mt-4 text-sm font-semibold text-[var(--text-muted)]">
          {index + 1} / {dishes.length}
        </span>
      </div>
    </div>
  );
};

export default SwipeDishesPopup;
