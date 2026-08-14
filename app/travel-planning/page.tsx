"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import { toast } from "react-toastify";
import dishesDataJson from "@/lib/famous_dishes_by_city.json";
import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { ISavedRestaurant, ISavedDish } from "@/lib/models";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Tag } from "@/components/ui/DietBadge";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type DishesJSON = { [city: string]: string[] };

interface Dish {
  name: string;
  image?: string;
  imageChecked: boolean;
  imageExists: boolean;
}

const dishesData = dishesDataJson as DishesJSON;

const dishNameToFilename = (dishName: string): string =>
  dishName
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[()]/g, "");

const getImagePath = (cityName: string, dishName: string): string => {
  const filename = dishNameToFilename(dishName);
  const baseURL =
    "https://cdn.jsdelivr.net/gh/ArnavSingh04/finding-nibbles-images@main/dishes/";
  return `${baseURL}${encodeURIComponent(cityName)}/${encodeURIComponent(
    filename
  )}.png`;
};

export default function TravelPlanningPage() {
  const { isLoggedIn } = useCurrentUser();
  const { confirm, dialog } = useConfirm();

  const cities = useMemo(() => Object.keys(dishesData).sort(), []);
  const [selectedCity, setSelectedCity] = useState<string>(cities[0] ?? "");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [savingDish, setSavingDish] = useState<string | null>(null);

  const {
    data: restaurants = [],
    loading: restaurantsLoading,
    refetch: refetchRestaurants,
  } = useResource<ISavedRestaurant[]>(() => api.savedRestaurants.list(), []);

  const {
    data: wishlist = [],
    refetch: refetchWishlist,
  } = useResource<ISavedDish[]>(() => api.savedDishes.list(), []);

  // Build the dish list for the selected city, then probe which images exist.
  useEffect(() => {
    if (!selectedCity) return;
    const list = dishesData[selectedCity] ?? [];
    const initial: Dish[] = list.map((name) => ({
      name,
      image: getImagePath(selectedCity, name),
      imageChecked: false,
      imageExists: false,
    }));
    setDishes(initial);

    let cancelled = false;
    (async () => {
      for (let i = 0; i < initial.length; i++) {
        const path = initial[i].image;
        let exists = false;
        try {
          const res = await fetch(path!, { method: "HEAD" });
          exists = res.ok;
        } catch {
          exists = false;
        }
        if (cancelled) return;
        setDishes((prev) =>
          prev.map((d, idx) =>
            idx === i ? { ...d, imageChecked: true, imageExists: exists } : d
          )
        );
        await new Promise((r) => setTimeout(r, 10));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  const savedDishFor = (name: string, city: string) =>
    wishlist.find((w) => w.name === name && w.city === city);

  const handleToggleDish = async (dishName: string, city: string) => {
    if (!isLoggedIn) {
      toast.info("Log in to save dishes to your wishlist");
      return;
    }
    const existing = savedDishFor(dishName, city);
    setSavingDish(dishName);
    try {
      if (existing?._id) {
        await api.savedDishes.remove(existing._id);
        toast.success(`Removed ${dishName}`);
      } else {
        await api.savedDishes.add(dishName, city);
        toast.success(`Saved ${dishName}`);
      }
      await refetchWishlist();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't update your wishlist");
    } finally {
      setSavingDish(null);
    }
  };

  const handleRemoveRestaurant = async (
    placeId: string,
    name: string
  ) => {
    const ok = await confirm({
      title: "Remove restaurant?",
      message: `"${name}" will be removed from your saved list.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.savedRestaurants.remove(placeId);
      toast.success("Restaurant removed");
      await refetchRestaurants();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't remove that restaurant");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Explore by city"
        title="Famous dishes to hunt down"
        subtitle="Pick a city, browse its signature dishes, and save the ones you want to try on your next trip."
      />

      <div className="mb-8 max-w-xs">
        <FormControl fullWidth size="small">
          <InputLabel id="city-select-label">City</InputLabel>
          <Select
            labelId="city-select-label"
            label="City"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            MenuProps={{ PaperProps: { style: { maxHeight: 360 } } }}
          >
            {cities.map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {dishes.length === 0 ? (
        <EmptyState
          emoji="🍜"
          title="No dishes for this city"
          message="Try picking a different city from the list."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => {
            const saved = !!savedDishFor(dish.name, selectedCity);
            const busy = savingDish === dish.name;
            return (
              <div
                key={dish.name}
                className="card-surface flex flex-col overflow-hidden animate-fade-in-up"
              >
                <div className="relative aspect-[4/3] w-full bg-sunset-soft">
                  {dish.imageExists && dish.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-4xl">
                      🍽️
                    </div>
                  )}
                  <Tooltip title={saved ? "Remove from wishlist" : "Save to wishlist"}>
                    <IconButton
                      onClick={() => handleToggleDish(dish.name, selectedCity)}
                      disabled={busy}
                      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "rgba(255,255,255,0.9)",
                        color: "var(--paprika)",
                        "&:hover": { bgcolor: "#fff" },
                      }}
                    >
                      {saved ? (
                        <FavoriteRoundedIcon />
                      ) : (
                        <FavoriteBorderRoundedIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-display text-base font-bold text-[var(--text)]">
                    {dish.name}
                  </h3>
                  <div className="mt-auto">
                    <Tag>
                      <PlaceRoundedIcon fontSize="inherit" /> {selectedCity}
                    </Tag>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">
          Your saved restaurants
        </h2>
        <p className="mt-1 mb-6 text-[var(--text-muted)]">
          Places you bookmarked while searching — add them to a trip anytime.
        </p>

        {restaurantsLoading ? (
          <LoadingState label="Loading saved restaurants…" />
        ) : restaurants.length === 0 ? (
          <EmptyState
            emoji="📍"
            title="No saved restaurants yet"
            message="Search for restaurants and tap save to build your shortlist."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className="card-surface flex flex-col gap-2 p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[var(--text)]">
                    {restaurant.name}
                  </h3>
                  <Tooltip title="Remove">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleRemoveRestaurant(restaurant.placeId, restaurant.name)
                      }
                      aria-label="Remove restaurant"
                      sx={{ color: "var(--paprika)" }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
                {restaurant.location && (
                  <p className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                    <PlaceRoundedIcon fontSize="inherit" />
                    {restaurant.location}
                  </p>
                )}
                {restaurant.rating != null && (
                  <p className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                    <StarRoundedIcon fontSize="inherit" sx={{ color: "var(--honey)" }} />
                    {restaurant.rating}
                  </p>
                )}
                {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {restaurant.cuisine.map((c) => (
                      <Tag key={c}>{c}</Tag>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {dialog}
    </PageContainer>
  );
}
