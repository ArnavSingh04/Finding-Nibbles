"use client";

import { useJsApiLoader } from "@react-google-maps/api";

/**
 * A SINGLE shared Google Maps loader configuration.
 *
 * `@react-google-maps/api` throws if `useJsApiLoader` is called from different
 * places with different options (id, key, libraries, flags). Every map-using
 * page must go through this hook so the options are always identical.
 */
export const GOOGLE_MAPS_LIBRARIES: "places"[] = ["places"];

export function useGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const loader = useJsApiLoader({
    id: "finding-nibbles-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  return { ...loader, hasKey: !!apiKey };
}
