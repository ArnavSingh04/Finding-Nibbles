"use client";

import React from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import type { ISavedRestaurant } from "@/lib/models";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/LoadingState";
import { GradientButton } from "@/components/ui/GradientButton";
import { Tag } from "@/components/ui/DietBadge";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export default function SavedRestaurantsPage() {
  const {
    data: restaurants = [],
    loading,
    error,
    refetch,
  } = useResource(() => api.savedRestaurants.list(), []);
  const { confirm, dialog } = useConfirm();

  const handleRemove = async (restaurant: ISavedRestaurant) => {
    const ok = await confirm({
      title: "Remove restaurant?",
      message: `Remove “${restaurant.name}” from your saved list?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.savedRestaurants.remove(restaurant.placeId);
      toast.success("Removed from saved.");
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't remove that restaurant.");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your collection"
        title="Saved restaurants"
        subtitle="The places you've bookmarked, ready to revisit."
        action={
          <Link href="/map">
            <GradientButton startIcon={<MapRoundedIcon />}>
              Find more
            </GradientButton>
          </Link>
        }
      />

      {loading ? (
        <SkeletonGrid count={6} height={180} />
      ) : error ? (
        <EmptyState
          emoji="😕"
          title="Couldn't load your saved places"
          message={error.message}
          action={
            <Button variant="outlined" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : restaurants.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title="No saved restaurants yet"
          message="Explore the map and bookmark places you'd love to try — they'll show up here."
          action={
            <Link href="/map">
              <GradientButton startIcon={<MapRoundedIcon />}>
                Explore the map
              </GradientButton>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant: ISavedRestaurant) => (
            <article
              key={restaurant._id ?? restaurant.placeId}
              className="card-surface animate-fade-in-up flex flex-col p-5"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-bold leading-snug text-[var(--text)]">
                  {restaurant.name}
                </h2>
                {restaurant.rating != null && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sunset-soft px-2.5 py-1 text-sm font-bold text-[var(--terracotta-strong)]">
                    <StarRoundedIcon sx={{ fontSize: 16 }} />
                    {restaurant.rating}
                  </span>
                )}
              </div>

              {restaurant.location && (
                <p className="flex items-start gap-1.5 text-sm text-[var(--text-muted)]">
                  <PlaceRoundedIcon sx={{ fontSize: 18 }} className="mt-0.5 shrink-0" />
                  <span>{restaurant.location}</span>
                </p>
              )}

              {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {restaurant.cuisine.map((c) => (
                    <Tag key={c}>{c}</Tag>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center gap-2 pt-4">
                <Link
                  href={`/map?q=${encodeURIComponent(restaurant.name)}`}
                  className="flex-1"
                >
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MapRoundedIcon />}
                  >
                    View on map
                  </Button>
                </Link>
                <Tooltip title="Remove">
                  <IconButton
                    color="error"
                    onClick={() => handleRemove(restaurant)}
                    aria-label={`Remove ${restaurant.name}`}
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog}
    </PageContainer>
  );
}
