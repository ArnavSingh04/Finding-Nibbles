"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { TextField, Button, IconButton } from "@mui/material";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";

// Keep libraries as a module-level const array to avoid reload warnings.
const GOOGLE_LIBRARIES: ("places")[] = ["places"];

export default function PlanDetailsPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: GOOGLE_LIBRARIES,
  });

  const { data: plan, loading, refetch } = useResource(
    () => api.plans.get(planId),
    [planId]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(plan?.title || "");
  const [restaurants, setRestaurants] = useState<any[]>(plan?.restaurants || []);
  const [startSearchValue, setStartSearchValue] = useState(plan?.startingPoint || "");
  const [destSearchValue, setDestSearchValue] = useState(plan?.destination || "");
  const [tripStartDate, setTripStartDate] = useState<string>(
    plan?.tripStartDate ? new Date(plan.tripStartDate).toISOString().split("T")[0] : ""
  );
  const startAutocompleteRef = useRef<any>(null);
  const destAutocompleteRef = useRef<any>(null);

  React.useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setRestaurants(plan.restaurants);
      setStartSearchValue(plan.startingPoint || "");
      setDestSearchValue(plan.destination || "");
      setTripStartDate(plan.tripStartDate ? new Date(plan.tripStartDate).toISOString().split("T")[0] : "");
    }
  }, [plan]);

  if (loading) return <div>Loading...</div>;
  if (!plan) return <div>Plan not found.</div>;

  const handleSave = async () => {
    try {
      await api.plans.update(planId, {
        title,
        restaurants,
        startingPoint: startSearchValue,
        destination: destSearchValue,
        tripStartDate: tripStartDate ? new Date(tripStartDate) : undefined,
      });
      setIsEditing(false);
      await refetch();
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    }
  };

  const handleCancel = () => {
    setTitle(plan.title);
    setRestaurants(plan.restaurants);
    setStartSearchValue(plan.startingPoint || "");
    setDestSearchValue(plan.destination || "");
    setTripStartDate(plan.tripStartDate ? new Date(plan.tripStartDate).toISOString().split("T")[0] : "");
    setIsEditing(false);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setRestaurants(prev => {
      const newArr = [...prev];
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
      return newArr;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === restaurants.length - 1) return;
    setRestaurants(prev => {
      const newArr = [...prev];
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
      return newArr;
    });
  };

  const onLoadStartAutocomplete = (autocomplete: any) => {
    startAutocompleteRef.current = autocomplete;
  };
  const onLoadDestAutocomplete = (autocomplete: any) => {
    destAutocompleteRef.current = autocomplete;
  };

  const onPlaceChangedStart = () => {
    if (startAutocompleteRef.current) {
      const place = startAutocompleteRef.current.getPlace();
      setStartSearchValue(place.formatted_address || place.name || "");
    }
  };
  const onPlaceChangedDest = () => {
    if (destAutocompleteRef.current) {
      const place = destAutocompleteRef.current.getPlace();
      setDestSearchValue(place.formatted_address || place.name || "");
    }
  };

  return (
    <div
      style={{
        paddingTop: "5rem",
        minHeight: "100vh",
        background: "#fdfaf7"
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          border: isEditing ? "2px solid #c17030" : "none",
          transition: "background 0.2s, border 0.2s"
        }}
      >
        {/* Back Button */}
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => router.push("/travel-plans")}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#c17030] text-white hover:bg-[#a65c27] transition-shadow shadow-sm cursor-pointer"
            aria-label="Back to travel plans"
          >
            <ArrowBackIcon />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2
            style={{
              fontFamily: "Comic Sans MS, cursive, sans-serif",
              color: "#c17030",
              paddingBottom: 15
            }}
          >
            {isEditing ? "Editing" : "Plan Details"}
          </h2>
          {isEditing ? (
            <span>
              <IconButton onClick={handleSave} color="primary">
                <SaveIcon />
              </IconButton>
              <IconButton onClick={handleCancel} color="error">
                <CloseIcon />
              </IconButton>
            </span>
          ) : (
            <IconButton onClick={() => setIsEditing(true)}>
              <EditIcon />
            </IconButton>
          )}
        </div>
        <form>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <TextField
              label="Plan Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              InputProps={{ readOnly: !isEditing }}
              style={{ margin: 0 }}
            />
            {/* Start Date Field */}
            <TextField
              label="Start Date"
              type="date"
              value={tripStartDate}
              onChange={(e) => setTripStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: !isEditing }}
              style={{ margin: 0 }}
            />
            {/* Starting Point Autocomplete */}
            {isLoaded ? (
              <Autocomplete
                onLoad={onLoadStartAutocomplete}
                onPlaceChanged={onPlaceChangedStart}
              >
                <TextField
                  size="small"
                  label="Starting Point"
                  variant="outlined"
                  fullWidth
                  placeholder="Type a location"
                  value={startSearchValue}
                  onChange={(e) => setStartSearchValue(e.target.value)}
                  InputProps={{ readOnly: !isEditing }}
                />
              </Autocomplete>
            ) : (
              <TextField
                size="small"
                label="Starting Point"
                variant="outlined"
                fullWidth
                placeholder="Type a location"
                value={startSearchValue}
                onChange={(e) => setStartSearchValue(e.target.value)}
                InputProps={{ readOnly: !isEditing }}
              />
            )}

            <div>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                Restaurants
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  padding: "12px 0"
                }}
              >
                {restaurants == null || restaurants.length === 0 ? (
                  <div
                    style={{
                      padding: "24px 18px",
                      background: "#f7f7f7",
                      borderRadius: 10,
                      border: "1px solid #e0e0e0",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      color: "#888",
                      textAlign: "center",
                      fontStyle: "italic",
                      fontSize: 18
                    }}
                  >
                    No restaurants added yet.
                  </div>
                ) : (
                  restaurants.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 18px",
                        background: "#f7f7f7",
                        borderRadius: 10,
                        border: "1px solid #e0e0e0",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                      }}
                    >
                      <span style={{ flex: 1 }}>
                        {r?.displayName?.text ||
                          r?.name ||
                          "Unnamed Restaurant"}
                        {idx === 0 && " (Start)"}
                        {idx === restaurants.length - 1 && " (End)"}
                      </span>
                      {isEditing && (
                        <>
                          <Button
                            size="small"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            sx={{ minWidth: 32, fontWeight: "bold" }}
                          >
                            ↑
                          </Button>
                          <Button
                            size="small"
                            onClick={() => moveDown(idx)}
                            disabled={idx === restaurants.length - 1}
                            sx={{ minWidth: 32, fontWeight: "bold" }}
                          >
                            ↓
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Destination Autocomplete */}
            {isLoaded ? (
              <Autocomplete
                onLoad={onLoadDestAutocomplete}
                onPlaceChanged={onPlaceChangedDest}
              >
                <TextField
                  size="small"
                  label="Final Destination"
                  variant="outlined"
                  fullWidth
                  placeholder="Type a location"
                  value={destSearchValue}
                  onChange={(e) => setDestSearchValue(e.target.value)}
                  InputProps={{ readOnly: !isEditing }}
                />
              </Autocomplete>
            ) : (
              <TextField
                size="small"
                label="Final Destination"
                variant="outlined"
                fullWidth
                placeholder="Type a location"
                value={destSearchValue}
                onChange={(e) => setDestSearchValue(e.target.value)}
                InputProps={{ readOnly: !isEditing }}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
