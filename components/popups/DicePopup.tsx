"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import { GradientButton } from "@/components/ui/GradientButton";
import "@/styles/popup.css";

interface DicePopupProps {
  open: boolean;
  onClose: () => void;
  availableCuisines: string[];
  onRoll?: (cuisine: string) => void;
}

const DicePopup: React.FC<DicePopupProps> = ({ open, onClose, availableCuisines, onRoll }) => {
  const [rolledCuisine, setRolledCuisine] = useState<string | null>(null);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(availableCuisines);
  const [isRolling, setIsRolling] = useState(false);
  const [diceFaces, setDiceFaces] = useState<string[]>([]);

  // Keep selected cuisines in sync when `availableCuisines` changes on open
  useEffect(() => {
    if (open) setSelectedCuisines(availableCuisines);
  }, [open, availableCuisines]);

  // Update dice faces when selected cuisines change
  useEffect(() => {
    if (selectedCuisines.length > 0) {
      let faces = [...selectedCuisines];
      while (faces.length < 6) {
        faces = [...faces, ...selectedCuisines.slice(0, 6 - faces.length)];
      }
      faces = faces.slice(0, 6).sort(() => Math.random() - 0.5);
      setDiceFaces(faces);
    } else {
      setDiceFaces(Array(6).fill("Roll"));
    }
  }, [selectedCuisines]);

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const rollDice = () => {
    if (selectedCuisines.length === 0) {
      toast.info("Pick at least one cuisine to roll.");
      return;
    }
    setIsRolling(true);
    setRolledCuisine(null);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * selectedCuisines.length);
      const selected = selectedCuisines[randomIndex];
      setRolledCuisine(selected);
      setIsRolling(false);

      onRoll?.(selected);

      const otherCuisines = selectedCuisines.filter((c) => c !== selected);
      const shuffled = [...otherCuisines].sort(() => Math.random() - 0.5);
      const rightFace = shuffled[0] || selected;
      const topFace = shuffled[1] && shuffled[1] !== rightFace ? shuffled[1] : shuffled[2] || selected;

      const used = [selected, rightFace, topFace];
      const rest = shuffled.filter((c) => !used.includes(c));
      while (used.length < 6) {
        used.push(rest.shift() || selected);
      }
      setDiceFaces([selected, rightFace, used[3], used[4], topFace, used[5]]);
    }, 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card-surface relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 text-center shadow-[var(--shadow-lg)] animate-fade-in-up">
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{ position: "absolute", top: 8, right: 8, color: "var(--text-muted)" }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">Roll the dice</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Can&rsquo;t decide? Let a cuisine pick you.
        </p>

        {/* Cuisine selection */}
        <div className="mt-5 text-left">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[var(--text)]">Nearby cuisines</h3>
            <Button size="small" color="inherit" onClick={() => setSelectedCuisines([])}>
              Deselect all
            </Button>
          </div>
          {availableCuisines.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No cuisines nearby yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableCuisines.map((cuisine) => {
                const active = selectedCuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => handleCuisineToggle(cuisine)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                      active
                        ? "border-transparent bg-sunset text-white shadow-[var(--shadow-sm)]"
                        : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3D dice */}
        <div className="dice-graphic" onClick={rollDice} role="button" aria-label="Roll the dice">
          <div className={`dice ${isRolling ? "rolling" : ""}`}>
            <div className="dice-face front">{rolledCuisine || diceFaces[0]}</div>
            <div className="dice-face back">{diceFaces[1]}</div>
            <div className="dice-face right">{diceFaces[2]}</div>
            <div className="dice-face left">{diceFaces[3]}</div>
            <div className="dice-face top">{diceFaces[4]}</div>
            <div className="dice-face bottom">{diceFaces[5]}</div>
          </div>
        </div>

        {rolledCuisine && !isRolling && (
          <p className="mb-4 text-[var(--text)]">
            Tonight&rsquo;s pick:{" "}
            <span className="font-display font-extrabold text-gradient">{rolledCuisine}</span>
          </p>
        )}

        <GradientButton
          fullWidth
          startIcon={<CasinoRoundedIcon />}
          onClick={rollDice}
          disabled={isRolling}
        >
          {isRolling ? "Rolling…" : "Roll the dice"}
        </GradientButton>
      </div>
    </div>
  );
};

export default DicePopup;
