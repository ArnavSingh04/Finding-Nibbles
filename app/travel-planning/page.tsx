"use client";

import React, { useEffect, useState } from "react";
import dishesDataJson from "@/lib/famous_dishes_by_city.json";
import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { ISavedRestaurant, ISavedDish } from "@/lib/models";

// interface { [city: string]: string[] }
type DishesJSON = { [city: string]: string[] };

interface Dish {
  name: string;
  image?: string; // path to local image
  imageLoaded?: boolean; // track if image exists
}

interface CityDishes {
  city: string;
  dishes: Dish[];
}

export default function TravelPlanningPage() {
  const { isLoggedIn } = useCurrentUser();
  const [cityDishes, setCityDishes] = useState<CityDishes[]>([]);

  const {
    data: restaurants = [],
    loading: restaurantsLoading,
    refetch: refetchRestaurants,
  } = useResource<ISavedRestaurant[]>(() => api.savedRestaurants.list(), []);

  const {
    data: wishlist = [],
    loading: wishlistLoading,
    refetch: refetchWishlist,
  } = useResource<ISavedDish[]>(() => api.savedDishes.list(), []);

  const dishesData: DishesJSON = dishesDataJson as DishesJSON;

  const dishNameToFilename = (dishName: string): string => {
    return dishName
      .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special characters except spaces, hyphens, underscores
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/[()]/g, ""); // Remove parentheses
  };

  // Updated helper function to get image path from GitHub CDN
  const getImagePath = (cityName: string, dishName: string): string => {
    const filename = dishNameToFilename(dishName);
    const baseURL =
      "https://cdn.jsdelivr.net/gh/ArnavSingh04/finding-nibbles-images@main/dishes/";
    return `${baseURL}${encodeURIComponent(cityName)}/${encodeURIComponent(
      filename
    )}.png`;
  };

  // Function to check if image exists
  const checkImageExists = async (imagePath: string): Promise<boolean> => {
    try {
      const response = await fetch(imagePath, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleAddDish = async (dishName: string, city: string) => {
    try {
      await api.savedDishes.add(dishName, city);
      await refetchWishlist();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveDish = async (dishId: string) => {
    try {
      await api.savedDishes.remove(dishId);
      await refetchWishlist();
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    // Step 1: Build initial structure with image paths
    const initialCities: CityDishes[] = Object.keys(dishesData).map((city) => ({
      city,
      dishes: dishesData[city].map((dishName) => ({
        name: dishName,
        image: getImagePath(city, dishName),
        imageLoaded: false
      }))
    }));

    setCityDishes(initialCities);

    // Step 2: Check which images exist asynchronously
    const checkImages = async () => {
      for (let cityIndex = 0; cityIndex < initialCities.length; cityIndex++) {
        const cityObj = initialCities[cityIndex];

        for (
          let dishIndex = 0;
          dishIndex < cityObj.dishes.length;
          dishIndex++
        ) {
          const dish = cityObj.dishes[dishIndex];

          if (dish.image) {
            const imageExists = await checkImageExists(dish.image);

            // Update the specific dish image loaded status in state
            setCityDishes((prev) => {
              const newState = [...prev];
              newState[cityIndex].dishes[dishIndex].imageLoaded = imageExists;
              if (!imageExists) {
                // If image doesn't exist, clear the image path
                newState[cityIndex].dishes[dishIndex].image = undefined;
              }
              return newState;
            });
          }

          // Small delay to avoid overwhelming the server with requests
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    };

    checkImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (placeId: string) => {
    try {
      await api.savedRestaurants.remove(placeId);
      await refetchRestaurants();
    } catch (error: any) {
      alert(`Failed to remove: ${error.message || error}`);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f5deb3", // Peach background color
        minHeight: "100vh",
        padding: "1rem",
        paddingTop: "80px", // Add top padding to account for navbar
        width: "100%",
        boxSizing: "border-box"
      }}
    >

      {/* DISH LIKE OPTIONS ADD HERE */}

      {/* DIS LIKE OPTIONS */}


      {/* Your Saved Restaurants Section */}
      <div style={{ marginBottom: "3rem" }}>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#333",
            textAlign: "center",
            marginBottom: "1.5rem",
            marginTop: "0",
            display: "block",
            width: "100%"
          }}
        >
          Your Saved Restaurants
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%"
          }}
        >
          {restaurantsLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "2rem"
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid #f3f3f3",
                  borderTop: "3px solid #b87b45",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}
              />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                width: "100%",
                maxWidth: "600px"
              }}
            >
              {restaurants.length > 0 ? (
                restaurants.map((restaurant) => (
                  <div
                    key={restaurant._id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      border: "2px solid #b87b45",
                      borderRadius: "12px",
                      padding: "1rem",
                      backgroundColor: "white",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem"
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: "600",
                          margin: "0"
                        }}
                      >
                        {restaurant.name}
                      </h3>
                      <button
                        onClick={() => handleRemove(restaurant.placeId)}
                        style={{
                          color: "black",
                          fontWeight: "bold",
                          fontSize: "1.5rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0",
                          lineHeight: "1"
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#b87b45")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "black")}
                      >
                        ×
                      </button>
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#374151",
                        margin: "0 0 0.25rem 0"
                      }}
                    >
                      {restaurant.location}
                    </p>
                    {restaurant.rating !== undefined &&
                      restaurant.rating !== null && (
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#374151",
                            margin: "0 0 0.25rem 0"
                          }}
                        >
                          Rating: {restaurant.rating}
                        </p>
                      )}
                    {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#374151",
                          margin: "0"
                        }}
                      >
                        Cuisine: {restaurant.cuisine.join(", ")}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    color: "#6B7280",
                    fontSize: "1rem",
                    fontStyle: "italic"
                  }}
                >
                  No saved restaurants found
                </p>
              )}
            </div>
          )}
        </div>
      </div>

{/* Add Dish wishlist section here */}

    </div>
  );
}
