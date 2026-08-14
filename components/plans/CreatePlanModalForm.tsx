"use client";

import React, { useState } from "react";
import { TextField, Button } from "@mui/material";
import { toast } from "react-toastify";
import { api } from "@/lib/api-client";
import { GradientButton } from "@/components/ui/GradientButton";

interface Restaurant {
  displayName?: { text: string };
  [key: string]: any;
}

interface CreatePlanModalFormProps {
  setIsCreatingPlan: (val: boolean) => void;
  selectedRestaurant: Restaurant | null;
  onCreated?: () => void;
}

export const CreatePlanModalForm: React.FC<CreatePlanModalFormProps> = ({
  setIsCreatingPlan,
  selectedRestaurant,
  onCreated,
}) => {
  const [planTitle, setPlanTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreatePlanAndAddRestaurant = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const title = planTitle.trim();
    if (!title) {
      toast.error("Give your trip a name first");
      return;
    }

    setSaving(true);
    try {
      const { _id: planId } = await api.plans.insert({ title });
      if (selectedRestaurant && planId) {
        await api.plans.addRestaurant(planId, selectedRestaurant);
      }
      toast.success(
        selectedRestaurant ? "Trip created and restaurant added" : "Trip created"
      );
      setIsCreatingPlan(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't create the trip");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleCreatePlanAndAddRestaurant}
      style={{ width: "100%" }}
    >
      <TextField
        autoFocus
        fullWidth
        size="small"
        label="Trip name"
        placeholder="Tokyo eats, Weekend away…"
        value={planTitle}
        onChange={(e) => setPlanTitle(e.target.value)}
        sx={{ mb: 2 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <GradientButton type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create + add"}
        </GradientButton>
        <Button
          type="button"
          color="inherit"
          onClick={() => setIsCreatingPlan(false)}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
