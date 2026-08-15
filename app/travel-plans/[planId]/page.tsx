"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  TextField,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Autocomplete } from "@react-google-maps/api";
import { toast } from "react-toastify";
import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import { useGoogleMaps } from "@/lib/useGoogleMaps";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientButton } from "@/components/ui/GradientButton";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const getRestaurantName = (r: any) =>
  r?.displayName?.text || r?.name || "Unnamed restaurant";

const toDateInput = (value?: Date | string | null) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};

export default function PlanDetailsPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  // Shared Maps loader (same options everywhere, so navigating between
  // map-using pages never re-initialises the loader with different options).
  const { isLoaded, hasKey } = useGoogleMaps();
  const autocompleteReady = isLoaded && hasKey;

  const { data: plan, loading, error, refetch } = useResource(
    () => api.plans.get(planId),
    [planId]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [startSearchValue, setStartSearchValue] = useState("");
  const [destSearchValue, setDestSearchValue] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const startAutocompleteRef = useRef<any>(null);
  const destAutocompleteRef = useRef<any>(null);
  const addRestoRef = useRef<any>(null);
  const [addRestoValue, setAddRestoValue] = useState("");

  const syncFromPlan = React.useCallback(() => {
    if (!plan) return;
    setTitle(plan.title || "");
    setRestaurants(Array.isArray(plan.restaurants) ? plan.restaurants : []);
    setStartSearchValue(plan.startingPoint || "");
    setDestSearchValue(plan.destination || "");
    setTripStartDate(toDateInput(plan.tripStartDate));
  }, [plan]);

  React.useEffect(() => {
    syncFromPlan();
  }, [syncFromPlan]);

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error("Give your trip a name before saving");
      return;
    }
    setSaving(true);
    try {
      await api.plans.update(planId, {
        title: cleanTitle,
        restaurants,
        startingPoint: startSearchValue.trim() || undefined,
        destination: destSearchValue.trim() || undefined,
        tripStartDate: tripStartDate ? new Date(tripStartDate) : null,
      });
      toast.success("Trip saved");
      setIsEditing(false);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't save the trip");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    syncFromPlan();
    setIsEditing(false);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setRestaurants((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setRestaurants((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const removeRestaurant = async (idx: number) => {
    const name = getRestaurantName(restaurants[idx]);
    const ok = await confirm({
      title: "Remove this stop?",
      message: `"${name}" will be removed from this trip.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setRestaurants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddRestaurant = () => {
    const place = addRestoRef.current?.getPlace?.();
    const name = place?.name || place?.formatted_address || addRestoValue.trim();
    if (!name) {
      toast.error("Search for a restaurant to add");
      return;
    }
    const entry: any = { name };
    if (place?.place_id) entry.placeId = place.place_id;
    if (place?.formatted_address) entry.location = place.formatted_address;
    if (place?.geometry?.location) {
      entry.latitude = place.geometry.location.lat();
      entry.longitude = place.geometry.location.lng();
    }
    setRestaurants((prev) => [...prev, entry]);
    setAddRestoValue("");
    toast.success(`Added ${name}. Save the trip to keep it.`);
  };

  const onPlaceChangedStart = () => {
    const place = startAutocompleteRef.current?.getPlace?.();
    if (place) setStartSearchValue(place.formatted_address || place.name || "");
  };
  const onPlaceChangedDest = () => {
    const place = destAutocompleteRef.current?.getPlace?.();
    if (place) setDestSearchValue(place.formatted_address || place.name || "");
  };

  if (loading) {
    return (
      <PageContainer width="narrow">
        <LoadingState label="Loading trip…" />
      </PageContainer>
    );
  }

  if (error || !plan) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          emoji="🧭"
          title="Trip not found"
          message={error?.message || "This trip may have been deleted."}
          action={
            <GradientButton onClick={() => router.push("/travel-plans")}>
              Back to trips
            </GradientButton>
          }
        />
      </PageContainer>
    );
  }

  const renderLocationField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    ref: React.MutableRefObject<any>,
    onPlaceChanged: () => void
  ) => {
    const field = (
      <TextField
        size="small"
        label={label}
        variant="outlined"
        fullWidth
        placeholder="Type a location"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{ readOnly: !isEditing }}
      />
    );
    if (autocompleteReady && isEditing) {
      return (
        <Autocomplete
          onLoad={(a) => (ref.current = a)}
          onPlaceChanged={onPlaceChanged}
        >
          {field}
        </Autocomplete>
      );
    }
    return field;
  };

  return (
    <PageContainer width="narrow">
      <div className="mb-4 flex items-center justify-between">
        <Button
          onClick={() => router.push("/travel-plans")}
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ textTransform: "none", fontWeight: 700 }}
          color="inherit"
        >
          All trips
        </Button>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCancel}
              startIcon={<CloseRoundedIcon />}
              color="inherit"
              disabled={saving}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <GradientButton
              onClick={handleSave}
              startIcon={<SaveRoundedIcon />}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </GradientButton>
          </div>
        ) : (
          <GradientButton
            onClick={() => setIsEditing(true)}
            startIcon={<EditRoundedIcon />}
          >
            Edit trip
          </GradientButton>
        )}
      </div>

      <div className="card-surface flex flex-col gap-6 p-6 sm:p-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[var(--paprika)]">
            <span className="h-1.5 w-1.5 rounded-full bg-sunset" />
            {isEditing ? "Editing trip" : "Trip details"}
          </div>
          <TextField
            label="Trip name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            InputProps={{ readOnly: !isEditing }}
          />
        </div>

        <TextField
          label="Start date"
          type="date"
          value={tripStartDate}
          onChange={(e) => setTripStartDate(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          InputProps={{ readOnly: !isEditing }}
        />

        {renderLocationField(
          "Starting point",
          startSearchValue,
          setStartSearchValue,
          startAutocompleteRef,
          onPlaceChangedStart
        )}

        <div>
          <div className="mb-3 font-display text-sm font-extrabold text-[var(--text)]">
            Restaurants along the way
          </div>
          <div className="flex flex-col gap-3">
            {restaurants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-8 text-center text-sm italic text-[var(--text-muted)]">
                No stops yet. {isEditing ? "Search below to add your first restaurant." : "Tap Edit trip to start adding restaurants."}
              </div>
            ) : (
              restaurants.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sunset-soft text-xs font-extrabold text-[var(--text)]">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text)]">
                    {getRestaurantName(r)}
                    {idx === 0 && (
                      <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
                        (Start)
                      </span>
                    )}
                    {idx === restaurants.length - 1 && restaurants.length > 1 && (
                      <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
                        (End)
                      </span>
                    )}
                  </span>
                  {isEditing && (
                    <div className="flex items-center">
                      <Tooltip title="Move up">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                          >
                            <ArrowUpwardRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => moveDown(idx)}
                            disabled={idx === restaurants.length - 1}
                          >
                            <ArrowDownwardRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove stop">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => removeRestaurant(idx)}
                            sx={{ color: "var(--paprika)" }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {isEditing && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {autocompleteReady ? (
                <Autocomplete
                  onLoad={(a) => (addRestoRef.current = a)}
                  onPlaceChanged={handleAddRestaurant}
                  className="flex-1"
                >
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search a restaurant to add"
                    value={addRestoValue}
                    onChange={(e) => setAddRestoValue(e.target.value)}
                  />
                </Autocomplete>
              ) : (
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add a restaurant by name"
                  value={addRestoValue}
                  onChange={(e) => setAddRestoValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRestaurant();
                    }
                  }}
                />
              )}
              <Button
                variant="outlined"
                onClick={handleAddRestaurant}
                startIcon={<AddRoundedIcon />}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Add stop
              </Button>
            </div>
          )}
        </div>

        {renderLocationField(
          "Final destination",
          destSearchValue,
          setDestSearchValue,
          destAutocompleteRef,
          onPlaceChangedDest
        )}
      </div>

      {dialog}
    </PageContainer>
  );
}
