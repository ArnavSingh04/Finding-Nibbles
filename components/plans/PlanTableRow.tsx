"use client";

import React from "react";
import Link from "next/link";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { toast } from "react-toastify";
import { api } from "@/lib/api-client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Tag } from "@/components/ui/DietBadge";

const getRestaurantName = (r: any) =>
  r?.displayName?.text || r?.name || "Unnamed restaurant";

const formatDate = (value?: Date | string | null) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * A single trip card. Renamed intent from "table row" to a card-surface tile,
 * keeping the exported name so existing imports keep working.
 */
export const PlanTableRow = ({
  plan,
  onChanged,
}: {
  plan: any;
  onChanged?: () => void;
}) => {
  const { confirm, dialog } = useConfirm();
  const [deleting, setDeleting] = React.useState(false);

  const restaurants: any[] = Array.isArray(plan.restaurants)
    ? plan.restaurants
    : [];
  const count = restaurants.length;
  const chips = restaurants.slice(0, 3);
  const startDate = formatDate(plan.tripStartDate);
  const title = plan.title?.trim() || "Untitled trip";

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this trip?",
      message: `"${title}" and its saved restaurants will be removed. This can't be undone.`,
      confirmLabel: "Delete trip",
      destructive: true,
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await api.plans.remove(plan._id);
      toast.success("Trip deleted");
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't delete this trip");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card-surface flex flex-col gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lg)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-extrabold leading-snug text-[var(--text)] line-clamp-2">
            {title}
          </h3>
          {(plan.startingPoint || plan.destination) && (
            <p className="mt-1 flex items-center gap-1 text-sm text-[var(--text-muted)]">
              <PlaceRoundedIcon fontSize="inherit" />
              <span className="truncate">
                {plan.startingPoint || "Anywhere"}
                {" → "}
                {plan.destination || "Anywhere"}
              </span>
            </p>
          )}
        </div>
        <Tooltip title="Delete trip">
          <span>
            <IconButton
              size="small"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete trip"
              sx={{ color: "var(--paprika)" }}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1 font-semibold">
          <EventRoundedIcon fontSize="inherit" />
          {startDate ?? "No date set"}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold">
          <RestaurantRoundedIcon fontSize="inherit" />
          {count} {count === 1 ? "stop" : "stops"}
        </span>
      </div>

      {count > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((r, i) => (
            <Tag key={i}>{getRestaurantName(r)}</Tag>
          ))}
          {count > chips.length && <Tag>+{count - chips.length} more</Tag>}
        </div>
      )}

      <div className="mt-auto pt-1">
        <Button
          component={Link}
          href={`/travel-plans/${plan._id}`}
          variant="outlined"
          fullWidth
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Open trip
        </Button>
      </div>

      {dialog}
    </div>
  );
};
