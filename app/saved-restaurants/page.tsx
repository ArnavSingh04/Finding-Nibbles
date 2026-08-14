"use client";

import React from "react";
import { api } from "@/lib/api-client";
import { useResource } from "@/lib/hooks";

export default function SavedRestaurantsPage() {
  const {
    data: restaurants = [],
    loading,
    refetch,
  } = useResource(() => api.savedRestaurants.list(), []);

  const handleRemove = async (placeId: string) => {
    try {
      await api.savedRestaurants.remove(placeId);
      await refetch();
    } catch (error: any) {
      alert(`Failed to remove: ${error.message || error}`);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen pt-20 font-[Comic_Sans_MS]">

      <main className="flex flex-col flex-1 items-center p-6">
        <div className="flex flex-col flex-1 items-center px-6 pb-6">
          <h1 className="text-2xl font-bold mb-6">Saved Restaurants</h1>

          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#b87b45]" />
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full max-w-md">
              {restaurants.length > 0 ? (
                restaurants.map((restaurant) => (
                  <div
                    key={restaurant._id}
                    className="flex flex-col border-2 border-[#b87b45] rounded-xl px-4 py-3 bg-white shadow"
                    role="region"
                    aria-label={`Saved restaurant ${restaurant.name}`}
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold">{restaurant.name}</h2>
                      <button
                        onClick={() => handleRemove(restaurant.placeId)}
                        className="text-black font-bold hover:text-[#b87b45]"
                        aria-label={`Remove ${restaurant.name}`}
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{restaurant.location}</p>
                    {restaurant.rating !== undefined && restaurant.rating !== null && (
                      <p className="text-sm text-gray-700">Rating: {restaurant.rating}</p>
                    )}
                    {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                      <p className="text-sm text-gray-700">
                        Cuisine: {restaurant.cuisine.join(', ')}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No saved restaurants found</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
