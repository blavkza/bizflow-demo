"use client";

import { useEffect, useRef } from "react";

let L: any;

interface MapProps {
  center: [number, number];
  onMapClick: (lat: number, lng: number) => void;
  markerPosition: [number, number];
}

export default function MapComponent({
  center,
  onMapClick,
  markerPosition,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Initialize map only once
  useEffect(() => {
    const initializeMap = async () => {
      if (typeof window === "undefined") return;
      if (isInitializedRef.current) return;

      L = await import("leaflet");

      delete (L.Icon.Default.prototype as any)._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      const map = L.map(mapRef.current).setView(center, 13);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar, GeoEye",
          maxZoom: 20,
        }
      ).addTo(map);

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        onMapClick(lat, lng);
      });

      markerRef.current = L.marker(center).addTo(map);

      mapInstanceRef.current = map;
      isInitializedRef.current = true;
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  // Update marker and recenter map instantly
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && L) {
      markerRef.current.setLatLng(markerPosition);

      mapInstanceRef.current.panTo(markerPosition);
    }
  }, [markerPosition]);

  // Update initial center if needed
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && L) {
      mapInstanceRef.current.setView(center, 13);
      markerRef.current.setLatLng(center);
    }
  }, [center]);

  return <div ref={mapRef} className="w-full h-full" />;
}
