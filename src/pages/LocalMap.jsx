import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, Star, Clock, ExternalLink, X, Leaf, ShoppingBag, Wheat, Apple, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MealIngredientFinder from "@/components/map/MealIngredientFinder";

const CATEGORY_FILTERS = [
  { label: "All Local Food", keyword: "local food grocery farmers market", icon: Leaf, color: "#D52B1E" },
  { label: "Grocery Stores", keyword: "grocery store supermarket", icon: ShoppingBag, color: "#2E7D32" },
  { label: "Farmers Markets", keyword: "farmers market local produce", icon: Apple, color: "#E65100" },
  { label: "Health Food", keyword: "health food organic store", icon: Wheat, color: "#6A1B9A" },
];

// Normalize geometry.location to a plain {lat, lng} object
function getLatLng(location) {
  if (!location) return null;
  const lat = typeof location.lat === "function" ? location.lat() : location.lat;
  const lng = typeof location.lng === "function" ? location.lng() : location.lng;
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export default function LocalMap() {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mealPlanMode, setMealPlanMode] = useState(false);
  const [ingredientPins, setIngredientPins] = useState([]); // [{ingredient, quantity, store_name, place}]
  const ingredientMarkersRef = useRef([]);

  const handleMealStoresFound = (stores) => {
    if (stores?.length) {
      setPlaces(stores);
      setTimeout(() => {
        if (googleMapRef.current && window.google?.maps) {
          window.google.maps.event.trigger(googleMapRef.current, "resize");
          addPlaceMarkers(stores);
        }
      }, 300);
    }
  };

  const handleIngredientPinsUpdate = (pins) => {
    setIngredientPins(pins);
    setTimeout(() => {
      if (googleMapRef.current && window.google?.maps) {
        window.google.maps.event.trigger(googleMapRef.current, "resize");
        addIngredientMarkers(pins);
        const firstPos = getLatLng(pins[0]?.place?.geometry?.location);
        if (firstPos) {
          googleMapRef.current.panTo(firstPos);
          googleMapRef.current.setZoom(14);
          setSelectedPlace({ ...pins[0].place, _ingredientPin: pins[0] });
        }
      }
    }, 300);
  };

  // Load Google Maps script using key from backend
  useEffect(() => {
    if (window.google?.maps) { setMapsLoaded(true); return; }
    base44.functions.invoke("getMapKey").then(res => {
      const key = res?.data?.key;
      if (!key) { setMapError("Google Maps API key not configured."); return; }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => setMapError("Google Maps failed to load. Please check your API key.");
      document.head.appendChild(script);
    }).catch(() => setMapError("Could not load map configuration."));
  }, []);

  const initMap = useCallback((lat, lng) => {
    if (!window.google?.maps || !mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 13,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#f5f5f0" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f0" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
        { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d8e8" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
        { featureType: "park", elementType: "geometry", stylers: [{ color: "#e5f0e5" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    googleMapRef.current = map;

    // User location marker
    new window.google.maps.Marker({
      position: { lat, lng },
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#D52B1E",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 3,
      },
      title: "You are here",
      zIndex: 999,
    });
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  const clearIngredientMarkers = () => {
    ingredientMarkersRef.current.forEach(m => m.setMap(null));
    ingredientMarkersRef.current = [];
  };

  const addIngredientMarkers = useCallback((pins) => {
    if (!googleMapRef.current || !window.google?.maps) return;
    clearIngredientMarkers();
    pins.forEach((pin) => {
      const pos = getLatLng(pin.place?.geometry?.location);
      if (!pos) return;
      const marker = new window.google.maps.Marker({
        position: pos,
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#2E7D32",
          fillOpacity: 0.95,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
        title: `${pin.ingredient} → ${pin.store_name}`,
        zIndex: 500,
      });
      marker.addListener("click", () => setSelectedPlace({ ...pin.place, _ingredientPin: pin }));
      ingredientMarkersRef.current.push(marker);
    });
  }, []);

  const addPlaceMarkers = useCallback((placeList) => {
    if (!googleMapRef.current || !window.google?.maps) return;
    clearMarkers();
    placeList.forEach((place, i) => {
      const pos = getLatLng(place.geometry?.location);
      if (!pos) return;
      const marker = new window.google.maps.Marker({
        position: pos,
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: CATEGORY_FILTERS[activeFilter].color,
          fillOpacity: 0.9,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
        title: place.name,
        label: { text: String(i + 1), color: "#fff", fontSize: "10px", fontWeight: "bold" },
      });
      marker.addListener("click", () => setSelectedPlace(place));
      markersRef.current.push(marker);
    });
  }, [activeFilter]);

  const fetchNearby = useCallback(async (lat, lng, filterIdx = activeFilter) => {
    setLoading(true);
    setSelectedPlace(null);
    const keyword = CATEGORY_FILTERS[filterIdx].keyword;
    const data = await base44.functions.invoke("mapsProxy", { action: "nearby", lat, lng, radius: 5000, keyword });
    const results = data?.data?.results || [];
    setPlaces(results);
    if (googleMapRef.current) addPlaceMarkers(results);
    setLoading(false);
  }, [activeFilter, addPlaceMarkers]);

  useEffect(() => {
    if (mapsLoaded && userLocation) {
      initMap(userLocation.lat, userLocation.lng);
      fetchNearby(userLocation.lat, userLocation.lng, activeFilter);
      // If meal plan was selected before location was available, fetch insights now

    }
  }, [mapsLoaded, userLocation]);

  const getLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationLoading(false);
      },
      () => {
        // Default to Toronto downtown
        const loc = { lat: 43.6532, lng: -79.3832 };
        setUserLocation(loc);
        setLocationLoading(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    const geo = await base44.functions.invoke("mapsProxy", { action: "geocode", address: searchInput + ", Ontario, Canada" });
    const loc = geo?.data?.results?.[0]?.geometry?.location;
    if (loc) {
      setUserLocation(loc);
      if (googleMapRef.current) googleMapRef.current.setCenter(loc);
      await fetchNearby(loc.lat, loc.lng, activeFilter);
    }
    setLoading(false);
  };

  const handleFilterChange = async (idx) => {
    setActiveFilter(idx);
    if (userLocation) await fetchNearby(userLocation.lat, userLocation.lng, idx);
  };

  const getDistanceKm = (place) => {
    if (!userLocation || !place.geometry?.location) return null;
    const pos = getLatLng(place.geometry.location);
    if (!pos) return null;
    const R = 6371;
    const lat1 = userLocation.lat * Math.PI / 180;
    const lat2 = pos.lat * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLng = (pos.lng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Top controls — shrink-0 so map always fills remaining space */}
      <div className="shrink-0 bg-white border-b border-gray-100 shadow-sm z-10">
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#D52B1E]" />
              <h1 className="text-lg font-bold text-gray-900">Local Food Map</h1>
            </div>
            {/* Meal plan mode toggle */}
            <button
              onClick={() => setMealPlanMode(m => !m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${mealPlanMode ? "maple-gradient text-white border-transparent" : "border-[#D52B1E] text-[#D52B1E] hover:bg-red-50"}`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {mealPlanMode ? "🗺️ Meal Plan Mode ON" : "Find Ingredients for My Meal Plan"}
            </button>
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Search a city or postal code..."
                  className="pl-9 rounded-xl text-sm"
                />
              </div>
              <Button onClick={handleSearch} variant="outline" className="rounded-xl shrink-0" size="sm">Search</Button>
              <Button onClick={getLocation} disabled={locationLoading} className="maple-gradient text-white rounded-xl shrink-0" size="sm">
                <Navigation className="w-4 h-4 mr-1" />
                {locationLoading ? "Locating..." : "Near Me"}
              </Button>
            </div>
          </div>
          {/* Category filters */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {CATEGORY_FILTERS.map((f, i) => (
              <button
                key={i}
                onClick={() => handleFilterChange(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${activeFilter === i ? "text-white shadow-md border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                style={activeFilter === i ? { backgroundColor: f.color, borderColor: f.color } : {}}
              >
                <f.icon className="w-3 h-3" />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* Meal Ingredient Finder — inside shrink-0 wrapper, scrollable */}
        <AnimatePresence>
          {mealPlanMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden max-h-[45vh] overflow-y-auto"
            >
              <MealIngredientFinder
                userLocation={userLocation}
                onGetLocation={getLocation}
                locationLoading={locationLoading}
                onStoresFound={handleMealStoresFound}
                onIngredientPins={handleIngredientPinsUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map + sidebar — flex-1 min-h-0 so they fill all remaining space */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto shrink-0 hidden md:block">
          <div className="p-4">
              {!userLocation && !loading && (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">Click "Near Me" to find local food options</p>
                  <Button onClick={getLocation} className="maple-gradient text-white rounded-xl" size="sm">
                    <Navigation className="w-4 h-4 mr-2" /> Use My Location
                  </Button>
                </div>
              )}
              {loading && (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              )}
              {!loading && places.length > 0 && (
                <>
                  <p className="text-xs text-gray-400 mb-3 font-medium">{places.length} places found nearby</p>
                  <div className="space-y-2">
                    {places.map((place, i) => (
                      <button
                        key={place.place_id}
                        onClick={() => { setSelectedPlace(place); const pos = getLatLng(place.geometry?.location); if (googleMapRef.current && pos) googleMapRef.current.panTo(pos); }}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedPlace?.place_id === place.place_id ? "border-[#D52B1E] bg-red-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: CATEGORY_FILTERS[activeFilter].color }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{place.name}</p>
                            <p className="text-xs text-gray-500 truncate">{place.vicinity}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {place.rating && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-500">
                                  <Star className="w-3 h-3 fill-amber-400" /> {place.rating}
                                </span>
                              )}
                              {getDistanceKm(place) && (
                                <span className="text-xs text-gray-400">{getDistanceKm(place)} km</span>
                              )}
                              {place.opening_hours?.open_now !== undefined && (
                                <span className={`text-xs font-medium ${place.opening_hours.open_now ? "text-green-600" : "text-red-500"}`}>
                                  {place.opening_hours.open_now ? "Open" : "Closed"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
        </div>

        {/* Map — flex-1 min-h-0 so it always has height */}
        <div className="flex-1 min-h-0 relative">
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center p-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">{mapError}</p>
              </div>
            </div>
          )}
          {!userLocation && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-green-50 z-10">
              <div className="text-center p-8">
                <div className="w-20 h-20 rounded-full maple-gradient flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Find Local Food Near You</h3>
                <p className="text-gray-500 mb-6 max-w-sm">Discover farmers markets, grocery stores, and local food options in your area</p>
                <Button onClick={getLocation} disabled={locationLoading} className="maple-gradient text-white rounded-xl px-8 py-3 text-base shadow-lg">
                  <Navigation className="w-5 h-5 mr-2" />
                  {locationLoading ? "Getting location..." : "Use My Location"}
                </Button>
              </div>
            </div>
          )}
          <div ref={mapRef} className="absolute inset-0" />

          {/* Selected place popup on mobile */}
          <AnimatePresence>
            {selectedPlace && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 z-20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {selectedPlace._ingredientPin && (
                      <div className="flex items-center gap-1.5 mb-1.5 bg-green-50 border border-green-100 rounded-lg px-2 py-1">
                        <span className="w-2 h-2 rounded-full bg-green-600 shrink-0" />
                        <span className="text-xs font-semibold text-green-800">{selectedPlace._ingredientPin.ingredient}</span>
                        <span className="text-xs text-green-600">· {selectedPlace._ingredientPin.quantity}</span>
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-sm">{selectedPlace.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedPlace.vicinity}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {selectedPlace.rating && (
                        <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {selectedPlace.rating} ({selectedPlace.user_ratings_total})
                        </span>
                      )}
                      {selectedPlace.opening_hours?.open_now !== undefined && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${selectedPlace.opening_hours.open_now ? "text-green-600" : "text-red-500"}`}>
                          <Clock className="w-3 h-3" /> {selectedPlace.opening_hours.open_now ? "Open now" : "Closed"}
                        </span>
                      )}
                      {getDistanceKm(selectedPlace) && (
                        <span className="text-xs text-gray-400">{getDistanceKm(selectedPlace)} km away</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedPlace(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${getLatLng(selectedPlace.geometry?.location)?.lat},${getLatLng(selectedPlace.geometry?.location)?.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full maple-gradient text-white rounded-lg text-xs">
                      <Navigation className="w-3 h-3 mr-1" /> Get Directions
                    </Button>
                  </a>
                  {selectedPlace.place_id && (
                    <a href={`https://www.google.com/maps/place/?q=place_id:${selectedPlace.place_id}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="rounded-lg">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}