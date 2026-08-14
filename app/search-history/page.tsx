"use client";

import React from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import type { ISearchHistory } from "@/lib/models";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { GradientButton } from "@/components/ui/GradientButton";
import { useConfirm } from "@/components/ui/ConfirmDialog";

function formatWhen(timestamp: Date | string) {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function SearchHistoryPage() {
  const {
    data: history = [],
    loading,
    error,
    refetch,
  } = useResource(() => api.searchHistory.list(), []);
  const { confirm, dialog } = useConfirm();

  const handleRemove = async (item: ISearchHistory) => {
    const ok = await confirm({
      title: "Remove search?",
      message: `Remove “${item.searchTerm}” from your history?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.searchHistory.remove(item.searchTerm);
      toast.success("Removed from history.");
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't remove that item.");
    }
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Where you've looked"
        title="Search history"
        subtitle="Jump back to a past search or tidy up your list."
        action={
          <Link href="/map">
            <GradientButton startIcon={<MapRoundedIcon />}>
              Open map
            </GradientButton>
          </Link>
        }
      />

      {loading ? (
        <LoadingState label="Loading your searches…" />
      ) : error ? (
        <EmptyState
          emoji="😕"
          title="Couldn't load your history"
          message={error.message}
          action={
            <Button variant="outlined" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : history.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No searches yet"
          message="Your searches will show up here as you explore places on the map."
          action={
            <Link href="/map">
              <GradientButton startIcon={<MapRoundedIcon />}>
                Start searching
              </GradientButton>
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {history.map((item: ISearchHistory) => (
            <li
              key={item._id ?? item.searchTerm}
              className="card-surface flex items-center gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[var(--text)]">
                  {item.searchTerm}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {formatWhen(item.timestamp)}
                </p>
              </div>

              <Tooltip title="Search this on the map">
                <Link
                  href={`/map?q=${encodeURIComponent(item.searchTerm)}`}
                  aria-label={`Search ${item.searchTerm} on the map`}
                >
                  <IconButton color="primary">
                    <MapRoundedIcon />
                  </IconButton>
                </Link>
              </Tooltip>

              <Tooltip title="Remove">
                <IconButton
                  onClick={() => handleRemove(item)}
                  aria-label={`Remove ${item.searchTerm}`}
                >
                  <CloseRoundedIcon />
                </IconButton>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}

      {dialog}
    </PageContainer>
  );
}
