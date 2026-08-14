"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { toast } from "react-toastify";
import { PlanTable } from "@/components/plans/PlanTable";
import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/LoadingState";
import { GradientButton } from "@/components/ui/GradientButton";

export default function SavedPlansPage() {
  const {
    data: plans = [],
    loading,
    error,
    refetch,
  } = useResource(() => api.plans.list(), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [destination, setDestination] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [saving, setSaving] = useState(false);

  const openDialog = () => {
    setNewTitle("");
    setStartingPoint("");
    setDestination("");
    setTripStartDate("");
    setDialogOpen(true);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      toast.error("Give your trip a name first");
      return;
    }
    setSaving(true);
    try {
      await api.plans.insert({
        title,
        startingPoint: startingPoint.trim() || undefined,
        destination: destination.trim() || undefined,
        tripStartDate: tripStartDate ? new Date(tripStartDate) : null,
      });
      toast.success("Trip created");
      setDialogOpen(false);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't create the trip");
    } finally {
      setSaving(false);
    }
  };

  const createButton = (
    <GradientButton startIcon={<AddRoundedIcon />} onClick={openDialog}>
      New trip
    </GradientButton>
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Travel plans"
        title="Your food trips"
        subtitle="Plan a route through the places you want to eat — one trip per city, adventure, or weekend away."
        action={plans.length > 0 ? createButton : undefined}
      />

      {loading ? (
        <SkeletonGrid count={6} height={220} />
      ) : error ? (
        <EmptyState
          emoji="😕"
          title="Couldn't load your trips"
          message={error.message}
          action={
            <Button variant="outlined" onClick={refetch}>
              Try again
            </Button>
          }
        />
      ) : plans.length === 0 ? (
        <EmptyState
          emoji="🧳"
          title="No trips yet"
          message="Start a trip and line up the restaurants you want to hit along the way."
          action={createButton}
        />
      ) : (
        <PlanTable plans={plans} onChanged={refetch} />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <form onSubmit={handleCreatePlan}>
          <DialogTitle sx={{ fontWeight: 800 }}>Start a new trip</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              required
              label="Trip name"
              placeholder="Tokyo eats, Road trip snacks…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Starting point"
              placeholder="Optional"
              value={startingPoint}
              onChange={(e) => setStartingPoint(e.target.value)}
              fullWidth
            />
            <TextField
              label="Destination"
              placeholder="Optional"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              fullWidth
            />
            <TextField
              label="Start date"
              type="date"
              value={tripStartDate}
              onChange={(e) => setTripStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              color="inherit"
              disabled={saving}
            >
              Cancel
            </Button>
            <GradientButton type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create trip"}
            </GradientButton>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
}
