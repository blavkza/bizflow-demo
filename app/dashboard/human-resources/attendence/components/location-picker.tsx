"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import dynamic from "next/dynamic";

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
}

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

const MapComponent = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted rounded-md flex items-center justify-center">
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  ),
});

// default
const DEFAULT_LOCATION: LocationData = {
  lat: -22.993312499737286,
  lng: 30.425680673099528,
  address: "NECS ENGINEERS MAIN OFFICE",
};

export function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationData>(DEFAULT_LOCATION);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Reverse Geocode
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );

      if (!response.ok) throw new Error("Failed reverse geocode");

      const data = await response.json();
      const address =
        data.display_name || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      setSelectedLocation({ lat, lng, address });
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setSelectedLocation({
        lat,
        lng,
        address: `Selected Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
      });
    }
  };

  // Map click
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({
      lat,
      lng,
      address: "Getting address...",
    });

    reverseGeocode(lat, lng);
  };

  // Search bar
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );

      if (!response.ok) throw new Error();

      const data = await response.json();

      if (data?.length > 0) {
        const result = data[0];
        const newLocation: LocationData = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name,
        };
        setSelectedLocation(newLocation);
      } else {
        alert("Location not found.");
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  // CURRENT LOCATION FIX
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setSelectedLocation({
          lat,
          lng,
          address: "Detecting address...",
        });

        reverseGeocode(lat, lng);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLocation);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Location</Label>
        <div className="flex space-x-2">
          <Input
            id="search"
            placeholder="Search for an address or place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Current Location */}
      <Button
        onClick={handleCurrentLocation}
        variant="outline"
        className="w-full"
      >
        <Navigation className="mr-2 h-4 w-4" />
        Use My Current Location
      </Button>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full h-96">
            <MapComponent
              center={[selectedLocation.lat, selectedLocation.lng]}
              onMapClick={handleMapClick}
              markerPosition={[selectedLocation.lat, selectedLocation.lng]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Info */}
      <div className="space-y-2">
        <div className="flex items-center text-sm font-medium">
          <MapPin className="h-4 w-4 mr-2" />
          Selected Location:
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedLocation.address}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>Latitude: {selectedLocation.lat.toFixed(6)}</div>
          <div>Longitude: {selectedLocation.lng.toFixed(6)}</div>
        </div>
      </div>

      <Button onClick={handleConfirm} className="w-full">
        <MapPin className="mr-2 h-4 w-4" />
        Confirm Selected Location
      </Button>
    </div>
  );
}
