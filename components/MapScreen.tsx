"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GoogleMap,
  Marker,
  Circle,
  Autocomplete,
  InfoWindow,
} from "@react-google-maps/api";
import { toast } from "react-toastify";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import Rating from "@mui/material/Rating";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import BookmarkAddRoundedIcon from "@mui/icons-material/BookmarkAddRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import DicePopup from "@/components/popups/DicePopup";
import SwipeDishesPopup from "@/components/popups/SwipeDishesPopup";
import { AddToPlanModal } from "@/components/plans/AddToPlanModal";
import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useGoogleMaps } from "@/lib/useGoogleMaps";
import type { ISavedRestaurant, PlanType } from "@/lib/models";

type SaveRestaurantInput = Omit<ISavedRestaurant, "userId" | "_id" | "createdAt">;

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

interface Location {
  lat: number;
  lng: number;
}

interface Review {
  authorName: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  time: number;
}

interface Restaurant {
  id?: string;
  displayName?: {
    text: string;
  };
  formattedAddress?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  types?: string[];
  reviews?: Review[];
  // Optional opening-hours signal from the Places API. Absent for many places,
  // in which case the "open now" filter degrades gracefully (treats as unknown).
  openNow?: boolean;
}

export const MapScreen = () => {
  const { user } = useCurrentUser();

  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [showSwipePopup, setShowSwipePopup] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDicePopupOpen, setIsDicePopupOpen] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [radius, setRadius] = useState(1000); // Default radius set to 1000 meters
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState<number | null>(
    null
  );
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [highlightedCuisine, setHighlightedCuisine] = useState<string | null>(
    null
  );

  const [isMapLoading, setIsMapLoading] = useState(true);
  const [debouncedRadius, setDebouncedRadius] = useState(radius);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedCusine, setSelectedCusine] = useState<string>("All");

  // New filter state
  const [minRating, setMinRating] = useState<number>(0);
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(true);

  const [isAddToPlanOpen, setIsAddToPlanOpen] = useState(false);

  // Google Maps JS API loader (replaces the <LoadScript> tag).
  const { isLoaded } = useGoogleMaps();

  // Show swipe popup on login (when Map loads), only once per session
  useEffect(() => {
    const hasSeenSwipe = sessionStorage.getItem("hasSeenSwipePopup");
    if (!hasSeenSwipe) {
      setShowSwipePopup(true);
      sessionStorage.setItem("hasSeenSwipePopup", "true");
    }
  }, []);

  // Replaces `useTracker(() => { Meteor.subscribe("plans"); return Plans.find({}).fetch(); }, [])`
  const { data: userPlans = [], refetch: refetchPlans } = useResource<PlanType[]>(
    () => api.plans.list(),
    []
  );

  // Replaces the `savedRestaurants` subscription + reactive `.find()`.
  const { refetch: refetchSavedRestaurants } = useResource<ISavedRestaurant[]>(
    () => api.savedRestaurants.list(),
    []
  );

  // Create debounced fetch function with useCallback
  const debouncedFetchRestaurants = useCallback(
    debounce(async (lat: number, lng: number, _rad: number) => {
      setIsMapLoading(true);
      try {
        // Results in 49 points
        const central_points = findCoordinates(lat, lng, 2000);

        const full_restaurant_search: Restaurant[][] = await Promise.all(
          central_points.map(({ lat, lng, radius }) =>
            fetchRestaurants(lat, lng, radius)
          )
        );

        // De-duplicate overlapping results from the multi-point search by place id.
        const flat = full_restaurant_search.flat();
        const byId = new Map<string, Restaurant>();
        for (const r of flat) {
          const key = r.id || `${r.location.latitude},${r.location.longitude}`;
          if (!byId.has(key)) byId.set(key, r);
        }
        setRestaurants([...byId.values()]);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        toast.error("We couldn't load restaurants here. Try again in a moment.");
      } finally {
        setIsMapLoading(false);
      }
    }, 500), // 500ms delay
    []
  );

  // Calculate radius conversions between metres and lat/lng degrees.
  const EARTH_RADIUS = 6378137;

  const deltaLat = (meters: number) => {
    const latRaw = (meters / EARTH_RADIUS) * (180 / Math.PI);
    return Math.round(latRaw * 10000) / 10000;
  };

  const deltaLng = (new_lattitude: number, meters: number) => {
    const lngRaw =
      (meters / (EARTH_RADIUS * Math.cos((new_lattitude * Math.PI) / 180))) *
      (180 / Math.PI);
    return Math.round(lngRaw * 10000) / 10000;
  };

  const horizontalLngDist = (a: number, b: number) => {
    return Math.sqrt(a ** 2 - b ** 2);
  };

  const findCoordinates = (
    central_lat: number,
    central_lng: number,
    search_radius: number
  ) => {
    const diameter = 2 * search_radius;
    const lat_change = deltaLat(diameter);
    const lng_distance = Math.ceil(horizontalLngDist(diameter, search_radius));

    const output = [];
    output.push({ lat: central_lat, lng: central_lng, radius: search_radius });

    output.push({
      lat: central_lat + lat_change,
      lng: central_lng,
      radius: search_radius,
    });
    output.push({
      lat: central_lat - lat_change,
      lng: central_lng,
      radius: search_radius,
    });

    {
      const lat_NE = central_lat + lat_change / 2;
      const lng_NE = central_lng + deltaLng(lat_NE, lng_distance);
      output.push({ lat: lat_NE, lng: lng_NE, radius: search_radius });
    }
    {
      const lat_SE = central_lat - lat_change / 2;
      const lng_SE = central_lng + deltaLng(lat_SE, lng_distance);
      output.push({ lat: lat_SE, lng: lng_SE, radius: search_radius });
    }
    {
      const lat_NW = central_lat + lat_change / 2;
      const lng_NW = central_lng - deltaLng(lat_NW, lng_distance);
      output.push({ lat: lat_NW, lng: lng_NW, radius: search_radius });
    }
    {
      const lat_SW = central_lat - lat_change / 2;
      const lng_SW = central_lng - deltaLng(lat_SW, lng_distance);
      output.push({ lat: lat_SW, lng: lng_SW, radius: search_radius });
    }

    return output;
  };

  //####################################

  function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Distance in m
    return EARTH_RADIUS * c;
  }

  // Update debounced radius when radius changes
  useEffect(() => {
    setDebouncedRadius(radius);
  }, [radius]);

  // Update restaurants when debounced radius changes
  useEffect(() => {
    if (userLocation && map) {
      debouncedFetchRestaurants(
        userLocation.lat,
        userLocation.lng,
        debouncedRadius
      );
    }
  }, [userLocation, map, debouncedRadius, debouncedFetchRestaurants]);

  // Deep-link: if arriving with ?q=<place> (e.g. from Search History), geocode
  // it once the map is ready, which recentres the map and loads restaurants.
  const handledQueryRef = React.useRef(false);
  useEffect(() => {
    if (!isLoaded || !map || handledQueryRef.current) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    handledQueryRef.current = true;
    setSearchValue(q);
    new google.maps.Geocoder().geocode({ address: q }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const next = { lat: loc.lat(), lng: loc.lng() };
        setUserLocation(next);
        map.panTo(next);
        saveSearchTerm(q);
      } else {
        toast.info(`Couldn't locate “${q}” - try searching again.`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Deep-link: arriving with ?dice=1 (e.g. from the dashboard) opens the roll.
  const handledDiceRef = React.useRef(false);
  useEffect(() => {
    if (handledDiceRef.current) return;
    if (new URLSearchParams(window.location.search).get("dice") === "1") {
      handledDiceRef.current = true;
      setIsDicePopupOpen(true);
    }
  }, []);

  useEffect(() => {
    const cuisineTypes = new Set<string>();
    restaurants.forEach((r) => {
      r.types?.forEach((t) => {
        if (isCuisineType(t)) cuisineTypes.add(normalizeCuisineType(t));
      });
    });
    setAvailableCuisines([...cuisineTypes].sort());
  }, [restaurants]);

  const mapOptions: google.maps.MapOptions = {
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    zoomControl: true,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  };

  const saveRestaurant = async (restaurant: Restaurant) => {
    const userId = user?._id;
    if (!userId) {
      toast.info("Log in to save restaurants to your list.");
      return;
    }

    const payload: SaveRestaurantInput = {
      placeId: restaurant.id || "",
      name: (restaurant.displayName?.text ?? "Unknown Name").trim(),
      location: (restaurant.formattedAddress ?? "Unknown Location").trim(),
      latitude: restaurant.location?.latitude,
      longitude: restaurant.location?.longitude,
      rating: restaurant.rating ?? null,
      cuisine: restaurant.types
        ? restaurant.types.filter(isCuisineType).map(normalizeCuisineType)
        : [],
    };

    try {
      await api.savedRestaurants.save(payload);
      await refetchSavedRestaurants();
      toast.success(`Saved ${payload.name} to your list.`);
    } catch (err: any) {
      const reason = err?.message || String(err);
      if (
        reason.toLowerCase().includes("duplicate") ||
        reason.toLowerCase().includes("already")
      ) {
        toast.info("This restaurant is already in your saved list.");
      } else {
        toast.error(`Couldn't save that: ${reason}`);
      }
      console.error("Error saving restaurant:", err);
    }
  };

  const containerStyle = {
    position: "fixed" as const,
    top: "4rem",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "calc(100vh - 4rem)",
    zIndex: 0, // Ensure it's behind navbar and controls
  };

  const onLoadAutocomplete = (
    autocompleteInstance: google.maps.places.Autocomplete
  ) => {
    setAutocomplete(autocompleteInstance);
  };

  // Function to save search term to database
  const saveSearchTerm = (term: string) => {
    if (term && term.trim() !== "") {
      api.searchHistory.save(term).catch((error) => {
        console.error("Error saving search term:", error);
      });
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setUserLocation(newLocation);
        if (map) {
          map.panTo(newLocation);
        }

        const searchTerm = place.name || place.formatted_address;
        if (searchTerm) {
          setSearchValue(searchTerm);
          saveSearchTerm(searchTerm);
        }
      }
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue && searchValue.trim() !== "") {
      saveSearchTerm(searchValue);
    }
  };

  // Normalize cuisine type from Google Places API
  const normalizeCuisineType = (type: string): string => {
    const baseType = type.replace("_restaurant", "");
    return baseType.charAt(0).toUpperCase() + baseType.slice(1);
  };

  const isCuisineType = (type: string): boolean => {
    const genericTypes = [
      "restaurant",
      "food",
      "meal_delivery",
      "meal_takeaway",
      "cafe",
      "bar",
      "bakery",
      "fast_food",
      "hamburger",
      "pizza",
      "sandwich",
      "breakfast",
      "lunch",
      "dinner",
    ];
    return (
      type.includes("restaurant") &&
      !genericTypes.some((genericType) => type === genericType)
    );
  };

  async function fetchRestaurants(
    latitude: number,
    longitude: number,
    searchRadius: number = radius
  ): Promise<Restaurant[]> {
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!API_KEY) {
      console.error("Google Places API key not found in settings");
      throw new Error("Google Places API key not configured");
    }

    const URL = "https://places.googleapis.com/v1/places:searchNearby";

    const requestBody = {
      includedTypes: ["restaurant"],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude,
          },
          radius: searchRadius,
        },
      },
    };

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.rating,places.types,places.id,places.location,places.currentOpeningHours.openNow",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.places || data.places.length === 0) {
        return [];
      }

      // Fetch reviews for each restaurant
      const restaurantsWithReviews = await Promise.all(
        data.places.map(async (restaurant: any) => {
          const openNow: boolean | undefined =
            restaurant.currentOpeningHours?.openNow;
          try {
            const detailsUrl = `https://places.googleapis.com/v1/places/${restaurant.id}`;
            const reviewsResponse = await fetch(detailsUrl, {
              headers: {
                "X-Goog-Api-Key": API_KEY,
                "X-Goog-FieldMask": [
                  "reviews.rating",
                  "reviews.text",
                  "reviews.publishTime",
                  "reviews.relativePublishTimeDescription",
                  "reviews.authorAttribution.displayName",
                ].join(","),
              },
            });
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              const normalizedReviews: Review[] = (
                reviewsData.reviews || []
              ).map((rev: any) => ({
                authorName: rev.authorAttribution?.displayName ?? "Anonymous",
                rating: rev.rating ?? 0,
                relativeTimeDescription:
                  rev.relativePublishTimeDescription ?? "",
                text: rev.text?.text ?? "",
                time: rev.publishTime ? Date.parse(rev.publishTime) : 0,
              }));
              return {
                ...restaurant,
                openNow,
                reviews: normalizedReviews,
              };
            }
          } catch (error) {
            console.error(
              `Error fetching reviews for ${restaurant.id}:`,
              error
            );
          }
          return {
            ...restaurant,
            openNow,
            reviews: [],
          };
        })
      );

      return restaurantsWithReviews;
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      throw error;
    }
  }

  const cuisineIcons: Record<string, string> = {
    Hamburger: "/images/burger.png",
    Italian: "/images/italian.png",
    Indian: "/images/indfsian.png",
  };

  const getCuisineIcon = (types: string[] | undefined): string | undefined => {
    if (!types) return;

    for (const type of types) {
      if (type.includes("restaurant")) {
        const cuisine = normalizeCuisineType(type);
        if (cuisineIcons[cuisine]) {
          return cuisineIcons[cuisine];
        }
      }
    }

    return undefined;
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const formatRadius = (value: number): string => {
    if (value < 1000) {
      return `${value} m`;
    } else {
      return `${(value / 1000).toFixed(1)} km`;
    }
  };

  const handleDiceRoll = (cuisine: string) => {
    setHighlightedCuisine(cuisine);
  };

  const isRestaurantHighlighted = (restaurant: Restaurant) => {
    if (!highlightedCuisine) return false;
    const normalizedHighlightedCuisine = highlightedCuisine.toLowerCase();
    return (
      restaurant.types?.some((type) => {
        if (!type.includes("restaurant")) return false;
        const normalizedType = type.replace("_restaurant", "").toLowerCase();
        return normalizedType === normalizedHighlightedCuisine;
      }) ?? false
    );
  };

  // Does the underlying data expose an "open now" signal for any place?
  // If not, we hide the open-now toggle rather than showing a control that no-ops.
  const hasOpenNowData = useMemo(
    () => restaurants.some((r) => typeof r.openNow === "boolean"),
    [restaurants]
  );

  // Central filter pipeline - applied to BOTH the map markers and the list.
  const visibleRestaurants = useMemo(() => {
    if (!userLocation) return [];
    return restaurants
      .filter((restaurant) => {
        // Cuisine filter
        if (selectedCusine !== "All") {
          const matchesCuisine = restaurant.types?.some(
            (type) =>
              type.includes("restaurant") &&
              normalizeCuisineType(type) === selectedCusine
          );
          if (!matchesCuisine) return false;
        }
        // Distance / radius filter
        const dist = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          restaurant.location.latitude,
          restaurant.location.longitude
        );
        if (dist > radius) return false;
        // Minimum rating filter (unrated places pass only when no minimum is set)
        if (minRating > 0 && (restaurant.rating ?? 0) < minRating) return false;
        // Open-now filter - only excludes places we KNOW are closed.
        if (openNowOnly && restaurant.openNow === false) return false;
        return true;
      })
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, userLocation, selectedCusine, radius, minRating, openNowOnly]);

  const activeFilterCount =
    (selectedCusine !== "All" ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (openNowOnly ? 1 : 0);

  const clearFilters = () => {
    setSelectedCusine("All");
    setMinRating(0);
    setOpenNowOnly(false);
  };

  const cuisineOf = (r: Restaurant) =>
    r.types
      ?.filter((type) => type.includes("restaurant"))
      .map(normalizeCuisineType)
      .join(", ") || "Restaurant";

  // Guard rendering until the Google Maps JS API is loaded.
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 top-16 grid place-items-center bg-[var(--bg)]">
        <LoadingState label="Loading the map…" />
      </div>
    );
  }

  return (
    <>
      {showSwipePopup && (
        <SwipeDishesPopup onClose={() => setShowSwipePopup(false)} />
      )}

      <div className="relative h-screen w-full">
        {userLocation ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={userLocation}
            zoom={14}
            options={{ ...mapOptions, scrollwheel: false }}
            onLoad={(mapInstance) => setMap(mapInstance)}
          >
            <Marker position={userLocation} />

            <Circle
              center={userLocation}
              radius={radius}
              options={{
                fillColor: "rgba(224, 122, 76, 0.14)",
                strokeColor: "#e07a4c",
                strokeOpacity: 0.85,
                strokeWeight: 2,
              }}
            />

            {visibleRestaurants.map((restaurant, index) => {
              const isHovered = hoveredMarkerIndex === index;
              const isHighlighted = isRestaurantHighlighted(restaurant);
              const iconUrl =
                getCuisineIcon(restaurant.types) || "/images/default.png";

              return (
                <Marker
                  key={restaurant.id ?? index}
                  position={{
                    lat: restaurant.location.latitude,
                    lng: restaurant.location.longitude,
                  }}
                  icon={{
                    url: iconUrl,
                    scaledSize: new window.google.maps.Size(
                      isHovered ? 50 : isHighlighted ? 45 : 40,
                      isHovered ? 50 : isHighlighted ? 45 : 40
                    ),
                  }}
                  animation={
                    isHighlighted ? google.maps.Animation.BOUNCE : undefined
                  }
                  onMouseOver={() => setHoveredMarkerIndex(index)}
                  onMouseOut={() => setHoveredMarkerIndex(null)}
                  onClick={() => setSelectedRestaurant(restaurant)}
                />
              );
            })}

            {selectedRestaurant && (
              <InfoWindow
                position={{
                  lat: selectedRestaurant.location.latitude,
                  lng: selectedRestaurant.location.longitude,
                }}
                onCloseClick={() => setSelectedRestaurant(null)}
              >
                {/* InfoWindow content lives in Google's own DOM, so it can't read
                    our CSS variables reliably. We keep it neutral/light and legible. */}
                <div style={{ maxWidth: 240, fontFamily: "inherit" }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#2b2320",
                      marginBottom: 2,
                    }}
                  >
                    {selectedRestaurant.displayName?.text || "Restaurant"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b615b", marginBottom: 6 }}>
                    {selectedRestaurant.formattedAddress || "Address unavailable"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "#4a423d",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: "#e0a72c", fontWeight: 700 }}>
                      ★ {selectedRestaurant.rating ?? "-"}
                    </span>
                    <span>·</span>
                    <span>{cuisineOf(selectedRestaurant)}</span>
                    {selectedRestaurant.openNow === true && (
                      <span style={{ color: "#4f8a3d", fontWeight: 700 }}>
                        · Open
                      </span>
                    )}
                    {selectedRestaurant.openNow === false && (
                      <span style={{ color: "#b0513a", fontWeight: 700 }}>
                        · Closed
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => saveRestaurant(selectedRestaurant)}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        backgroundImage:
                          "linear-gradient(135deg, #f0a92c, #e0562c)",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsAddToPlanOpen(true)}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        background: "transparent",
                        color: "#c65a2e",
                        border: "1.5px solid #e0864c",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Add to plan
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="fixed inset-0 top-16 grid place-items-center bg-[var(--bg)]">
            <LoadingState label="Finding your location…" />
          </div>
        )}

        {/* ── Top-left: search + filters panel ─────────────────────────── */}
        <div className="absolute left-3 top-[4.5rem] z-[45] w-[min(92vw,340px)]">
          <div className="card-surface p-3 shadow-[var(--shadow-lg)]">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 focus-within:border-[var(--terracotta)]">
                <SearchRoundedIcon
                  fontSize="small"
                  className="text-[var(--text-muted)]"
                />
                <Autocomplete
                  onLoad={onLoadAutocomplete}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Search a place or address"
                    className="w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                    value={searchValue}
                    onChange={handleSearchInputChange}
                  />
                </Autocomplete>
              </div>
            </form>

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <TuneRoundedIcon sx={{ fontSize: 16 }} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-sunset px-1 text-[10px] font-extrabold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold text-[var(--terracotta-strong)] hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-2 space-y-3 animate-fade-in-up">
                <Divider sx={{ borderColor: "var(--border)" }} />

                {/* Cuisine chips */}
                <div>
                  <div className="mb-1.5 text-xs font-bold text-[var(--text-muted)]">
                    Cuisine
                  </div>
                  <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                    <Chip
                      label="All"
                      size="small"
                      onClick={() => setSelectedCusine("All")}
                      color={selectedCusine === "All" ? "primary" : "default"}
                      variant={selectedCusine === "All" ? "filled" : "outlined"}
                      sx={{ fontWeight: 700 }}
                    />
                    {availableCuisines.map((cuisine) => (
                      <Chip
                        key={cuisine}
                        label={cuisine}
                        size="small"
                        onClick={() => setSelectedCusine(cuisine)}
                        color={
                          selectedCusine === cuisine ? "primary" : "default"
                        }
                        variant={
                          selectedCusine === cuisine ? "filled" : "outlined"
                        }
                        sx={{ fontWeight: 700 }}
                      />
                    ))}
                    {availableCuisines.length === 0 && (
                      <span className="text-xs text-[var(--text-muted)]">
                        Cuisines appear once results load.
                      </span>
                    )}
                  </div>
                </div>

                {/* Minimum rating */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-[var(--text-muted)]">
                    Min rating
                  </div>
                  <div className="flex items-center gap-2">
                    <Rating
                      size="small"
                      value={minRating}
                      precision={1}
                      onChange={(_, v) => setMinRating(v ?? 0)}
                      emptyIcon={
                        <StarRoundedIcon
                          fontSize="inherit"
                          sx={{ color: "var(--border)" }}
                        />
                      }
                      icon={<StarRoundedIcon fontSize="inherit" />}
                    />
                    {minRating > 0 && (
                      <button
                        type="button"
                        onClick={() => setMinRating(0)}
                        className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text)]"
                      >
                        Any
                      </button>
                    )}
                  </div>
                </div>

                {/* Open now - only shown when the data actually supports it */}
                {hasOpenNowData && (
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[var(--text-muted)]">
                      Open now
                    </div>
                    <Switch
                      size="small"
                      checked={openNowOnly}
                      onChange={(e) => setOpenNowOnly(e.target.checked)}
                    />
                  </div>
                )}

                {/* Distance / radius */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                    <span>Distance</span>
                    <span className="text-[var(--terracotta-strong)]">
                      {formatRadius(radius)}
                    </span>
                  </div>
                  <Slider
                    value={radius}
                    onChange={(_, v) => setRadius(v as number)}
                    min={500}
                    max={6000}
                    step={100}
                    size="small"
                    sx={{ color: "var(--terracotta)" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Top-right: updating indicator ────────────────────────────── */}
        {userLocation && isMapLoading && (
          <div className="absolute right-3 top-[4.5rem] z-[45]">
            <div className="card-surface flex items-center gap-2 px-3 py-2 shadow-[var(--shadow-md)]">
              <CircularProgress size={16} color="primary" />
              <span className="text-xs font-bold text-[var(--text)]">
                Updating restaurants…
              </span>
            </div>
          </div>
        )}

        {/* ── Bottom-left: action buttons ──────────────────────────────── */}
        <div className="absolute bottom-4 left-3 z-[46] flex flex-col gap-2">
          <Tooltip title={isSidebarOpen ? "Hide results" : "Show results"} placement="right">
            <span>
              <IconButton
                onClick={() => setIsSidebarOpen((v) => !v)}
                sx={{
                  bgcolor: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-md)",
                  color: "var(--text)",
                  "&:hover": { bgcolor: "var(--bg)" },
                }}
              >
                {isSidebarOpen ? <ViewSidebarRoundedIcon /> : <MenuOpenRoundedIcon />}
              </IconButton>
            </span>
          </Tooltip>

          <Button
            onClick={() => setIsDicePopupOpen(true)}
            startIcon={<CasinoRoundedIcon />}
            sx={{
              backgroundImage: "var(--sunset)",
              color: "#fff",
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
              boxShadow: "var(--shadow-md)",
              "&:hover": { filter: "brightness(1.05)", backgroundImage: "var(--sunset)" },
            }}
          >
            Roll the dice
          </Button>

          {highlightedCuisine && (
            <Button
              variant="outlined"
              onClick={() => setHighlightedCuisine(null)}
              startIcon={<CloseRoundedIcon />}
              sx={{
                bgcolor: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
                fontWeight: 700,
                borderRadius: 999,
                "&:hover": { borderColor: "var(--terracotta)", bgcolor: "var(--bg)" },
              }}
            >
              Clear {highlightedCuisine}
            </Button>
          )}
        </div>

        {/* ── Right sidebar: results list ──────────────────────────────── */}
        {isSidebarOpen && (
          <aside className="absolute right-0 top-16 z-[47] flex h-[calc(100vh-4rem)] w-[min(90vw,360px)] flex-col border-l border-[var(--border)] bg-[var(--surface)]/95 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
              <div>
                <h2 className="font-display text-base font-extrabold text-[var(--text)]">
                  {visibleRestaurants.length} spot
                  {visibleRestaurants.length === 1 ? "" : "s"} nearby
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Within {formatRadius(radius)}
                  {highlightedCuisine ? ` · highlighting ${highlightedCuisine}` : ""}
                </p>
              </div>
              <IconButton
                size="small"
                onClick={() => setIsSidebarOpen(false)}
                sx={{ color: "var(--text-muted)" }}
                aria-label="Close results"
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {isMapLoading && restaurants.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="card-surface h-24 animate-pulse"
                      aria-hidden
                    />
                  ))}
                </div>
              ) : visibleRestaurants.length === 0 ? (
                <EmptyState
                  emoji="🍽️"
                  title="No matches here"
                  message={
                    activeFilterCount > 0
                      ? "Try widening the distance or clearing a filter."
                      : "Try a wider search radius or a different area."
                  }
                  action={
                    activeFilterCount > 0 ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={clearFilters}
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                      >
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-3">
                  {visibleRestaurants.map((restaurant, index) => {
                    const highlighted = isRestaurantHighlighted(restaurant);
                    return (
                      <article
                        key={restaurant.id ?? index}
                        onMouseEnter={() => setHoveredMarkerIndex(index)}
                        onMouseLeave={() => setHoveredMarkerIndex(null)}
                        className={`card-surface cursor-pointer p-3 transition-all hover:shadow-[var(--shadow-md)] ${
                          highlighted
                            ? "ring-2 ring-[var(--terracotta)] bg-sunset-soft"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedRestaurant(restaurant);
                          if (map) {
                            map.panTo({
                              lat: restaurant.location.latitude,
                              lng: restaurant.location.longitude,
                            });
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-sm font-extrabold leading-snug text-[var(--text)]">
                            {restaurant.displayName?.text || "Restaurant"}
                          </h3>
                          {typeof restaurant.rating === "number" && (
                            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--honey)]/15 px-2 py-0.5 text-xs font-extrabold text-[var(--terracotta-strong)]">
                              <StarRoundedIcon sx={{ fontSize: 14 }} />
                              {restaurant.rating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 flex items-start gap-1 text-xs text-[var(--text-muted)]">
                          <PlaceRoundedIcon sx={{ fontSize: 14, mt: "1px" }} />
                          <span className="line-clamp-2">
                            {restaurant.formattedAddress || "Address unavailable"}
                          </span>
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-muted)]">
                            {cuisineOf(restaurant)}
                          </span>
                          {restaurant.openNow === true && (
                            <span className="inline-flex items-center rounded-full bg-[var(--basil)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--basil)]">
                              Open now
                            </span>
                          )}
                          {restaurant.openNow === false && (
                            <span className="inline-flex items-center rounded-full bg-[var(--paprika)]/12 px-2 py-0.5 text-[11px] font-bold text-[var(--paprika)]">
                              Closed
                            </span>
                          )}
                        </div>

                        {restaurant.reviews && restaurant.reviews.length > 0 && (
                          <p className="mt-2 line-clamp-2 border-l-2 border-[var(--border)] pl-2 text-[11px] italic text-[var(--text-muted)]">
                            “{restaurant.reviews[0].text}”
                          </p>
                        )}

                        <div
                          className="mt-2.5 flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="small"
                            startIcon={<BookmarkAddRoundedIcon />}
                            onClick={() => saveRestaurant(restaurant)}
                            sx={{
                              backgroundImage: "var(--sunset)",
                              color: "#fff",
                              fontWeight: 700,
                              borderRadius: 999,
                              flex: 1,
                              fontSize: 12,
                              "&:hover": {
                                filter: "brightness(1.05)",
                                backgroundImage: "var(--sunset)",
                              },
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EventAvailableRoundedIcon />}
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
                              setIsAddToPlanOpen(true);
                            }}
                            sx={{
                              borderColor: "var(--border)",
                              color: "var(--text)",
                              fontWeight: 700,
                              borderRadius: 999,
                              flex: 1,
                              fontSize: 12,
                              "&:hover": {
                                borderColor: "var(--terracotta)",
                                bgcolor: "var(--bg)",
                              },
                            }}
                          >
                            Plan
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        <DicePopup
          open={isDicePopupOpen}
          onClose={() => setIsDicePopupOpen(false)}
          availableCuisines={availableCuisines}
          onRoll={handleDiceRoll}
        />

        <AddToPlanModal
          open={isAddToPlanOpen}
          onClose={() => setIsAddToPlanOpen(false)}
          userPlans={userPlans}
          selectedRestaurant={selectedRestaurant}
          onPlansChanged={refetchPlans}
        />
      </div>
    </>
  );
};
