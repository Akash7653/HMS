import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import HotelCard from "../components/ui/HotelCard";
import HotelMap from "../components/ui/HotelMap";
import SkeletonCard from "../components/ui/SkeletonCard";
import { INDIA_STATES } from "../data/indiaStates";

const defaultFilters = {
  city: "",
  state: "",
  minPrice: "",
  maxPrice: "",
  rating: "",
  sortBy: "popularity",
  limit: 8,
};

const amenities = ["WiFi", "AC", "Pool"];

export default function HotelsPage() {
  const savedAlertsKey = "hms_saved_search_alerts";
  const [params] = useSearchParams();
  const [scope, setScope] = useState("India");
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    ...defaultFilters,
    city: params.get("city") || "",
  });

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        // Search for hotels near user's location
        setFilters(prev => ({
          ...prev,
          city: "Near Me",
          latitude,
          longitude
        }));
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please enable location services.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [mapHotels, setMapHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapDrivenSearch, setMapDrivenSearch] = useState(false);
  const [viewportHotelIds, setViewportHotelIds] = useState([]);
  const [viewportInfo, setViewportInfo] = useState({ visibleCount: 0, markerCount: 0, zoom: 4 });
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState({
    trendingCities: [],
    cities: [],
    states: [],
    hotels: [],
  });
  const [savedAlerts, setSavedAlerts] = useState(() => {
    try {
      const raw = localStorage.getItem(savedAlertsKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const loadMoreRef = useRef(null);

  const fetchHotels = useCallback(async (mode = "page", options = {}) => {
    const { targetPage = 1, append = false } = options;

    if (mode === "map") {
      setMapLoading(true);
    } else if (!append) {
      setLoading(true);
    }

    try {
      const query = {
        city: filters.city,
        state: filters.state,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        page: mode === "map" ? 1 : targetPage,
        limit: mode === "map" ? 1008 : filters.limit,
        sortBy: "createdAt",
        order: "desc",
      };

      // Add location parameters if searching near user
      if (filters.latitude && filters.longitude) {
        query.latitude = filters.latitude;
        query.longitude = filters.longitude;
        query.radius = 50; // Search within 50km
      }

      const res = await api.get("/hotels", { params: query });
      const serverHotels = res.data.data || [];

      if (mode === "map") {
        setMapHotels(serverHotels);
      } else {
        setHotels((prev) => {
          if (!append) return serverHotels;
          const merged = [...prev, ...serverHotels];
          const unique = new Map(merged.map((hotel) => [hotel._id, hotel]));
          return Array.from(unique.values());
        });
        setPagination(res.data.pagination || { page: targetPage, pages: 1, total: 0 });
      }
    } catch {
      if (mode === "map") {
        setMapHotels([]);
      } else {
        if (!append) {
          setHotels([]);
        }
        setPagination({ page: 1, pages: 1, total: 0 });
      }
    } finally {
      if (mode === "map") {
        setMapLoading(false);
      } else if (!append) {
        setLoading(false);
      }
    }
  }, [filters.city, filters.state, filters.minPrice, filters.maxPrice, filters.rating, filters.limit]);

  useEffect(() => {
    const city = params.get("city") || "";
    setFilters((prev) => ({ ...prev, city }));
  }, [params]);

  useEffect(() => {
    fetchHotels("page", { targetPage: 1, append: false });
  }, [fetchHotels]);

  useEffect(() => {
    if (!showMap) return;
    fetchHotels("map");
  }, [showMap, fetchHotels]);

  useEffect(() => {
    localStorage.setItem(savedAlertsKey, JSON.stringify(savedAlerts.slice(0, 10)));
  }, [savedAlerts]);

  useEffect(() => {
    const cityText = filters.city.trim();
    if (!cityText) {
      setSuggestions({ trendingCities: [], cities: [], states: [], hotels: [] });
      return;
    }

    const handle = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await api.get("/hotels/suggestions", { params: { q: cityText } });
        setSuggestions(res.data?.suggestions || { trendingCities: [], cities: [], states: [], hotels: [] });
      } catch {
        setSuggestions({ trendingCities: [], cities: [], states: [], hotels: [] });
      } finally {
        setSuggestionsLoading(false);
      }
    }, 260);

    return () => clearTimeout(handle);
  }, [filters.city]);

  const canAutoLoad =
    !showMap &&
    !mapDrivenSearch &&
    !loading &&
    !isLoadingMore &&
    pagination.page < pagination.pages;

  useEffect(() => {
    if (!canAutoLoad || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;

        setIsLoadingMore(true);
        fetchHotels("page", { targetPage: pagination.page + 1, append: true }).finally(() => {
          setIsLoadingMore(false);
        });
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [canAutoLoad, fetchHotels, pagination.page]);

  const applyLocalFilters = (list) => {
    let result = [...list];

    if (selectedAmenities.length) {
      result = result.filter((hotel) => selectedAmenities.every((a) => hotel.amenities?.includes(a)));
    }

    if (filters.sortBy === "price") {
      result.sort((a, b) => Math.min(...a.roomTypes.map((r) => r.basePrice)) - Math.min(...b.roomTypes.map((r) => r.basePrice)));
    }

    if (filters.sortBy === "rating") {
      result.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
    }

    return result;
  };

  const displayedHotels = useMemo(() => applyLocalFilters(hotels), [hotels, selectedAmenities, filters.sortBy]);
  const displayedMapHotels = useMemo(() => applyLocalFilters(mapHotels), [mapHotels, selectedAmenities, filters.sortBy]);

  const viewportHotelIdSet = useMemo(() => new Set(viewportHotelIds), [viewportHotelIds]);

  const viewportMatchedHotels = useMemo(
    () => displayedMapHotels.filter((hotel) => viewportHotelIdSet.has(hotel._id)),
    [displayedMapHotels, viewportHotelIdSet]
  );

  const hotelsForGrid = mapDrivenSearch && showMap ? viewportMatchedHotels : displayedHotels;

  const dynamicPricingBadge = useMemo(() => {
    const day = new Date().getDay();
    const month = new Date().getMonth() + 1;
    if (month === 10 || month === 11) return "Festival pricing live";
    if (day === 0 || day === 6) return "Weekend surge pricing";
    return "Weekday deal pricing";
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchHotels("page", { targetPage: 1, append: false });
    if (showMap) {
      fetchHotels("map");
    }
  };

  const toggleAmenity = (name) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const onMapViewportChange = useCallback((payload) => {
    setViewportHotelIds(payload.visibleHotelIds || []);
    setViewportInfo({
      visibleCount: payload.visibleCount || 0,
      markerCount: payload.markerCount || 0,
      zoom: payload.zoom || 4,
    });
  }, []);

  const saveCurrentAlert = () => {
    const titleParts = [];
    if (filters.state) titleParts.push(filters.state);
    if (filters.city) titleParts.push(filters.city);
    if (filters.minPrice || filters.maxPrice) titleParts.push(`Rs. ${filters.minPrice || 0}-${filters.maxPrice || "max"}`);
    const title = titleParts.length ? titleParts.join(" • ") : "India hotels";

    const alert = {
      id: Date.now(),
      title,
      filters: {
        city: filters.city,
        state: filters.state,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        sortBy: filters.sortBy,
      },
    };

    setSavedAlerts((prev) => [alert, ...prev].slice(0, 10));
  };

  const applySavedAlert = (alert) => {
    setFilters((prev) => ({ ...prev, ...alert.filters }));
  };

  const deleteSavedAlert = (id) => {
    setSavedAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const hasSuggestions =
    suggestions.trendingCities.length ||
    suggestions.cities.length ||
    suggestions.states.length ||
    suggestions.hotels.length;

  const applySuggestion = (value, type) => {
    setShowSuggestions(false);
    setFilters((prev) => {
      if (type === "state") {
        return { ...prev, state: value };
      }
      return { ...prev, city: value };
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-3 px-3 py-3 pb-8 md:space-y-6 md:px-4 md:py-7 md:pb-8 lg:px-6 xl:px-8">
      <div className="space-y-3 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-5 lg:space-y-0 xl:gap-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card space-y-2.5 border-blue-100/70 bg-gradient-to-br from-[#e9f3ff] via-white to-[#f7fbff] p-3.5 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 lg:sticky lg:top-24 lg:space-y-3 lg:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[22px] font-bold sm:text-2xl lg:text-3xl">Hotel Listings</h1>
            <p className="mt-0.5 hidden text-sm text-slate-600 lg:block dark:text-slate-300">Find and compare top stays with smart filters.</p>
          </div>
          <button type="button" onClick={() => setShowMap((v) => !v)} className="btn-secondary px-3 py-1.5 text-[11px] lg:px-3.5 lg:py-2 lg:text-xs">
            {showMap ? "Hide Map" : "Map View"}
          </button>
        </div>

        <div className="inline-flex rounded-full border border-blue-200 bg-blue-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/70">
          {["India", "International"].map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-full px-3.5 py-1 text-[11px] font-semibold ${scope === item ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-slate-600 dark:text-slate-300"}`}
              onClick={() => setScope(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={onSearch} className="space-y-1.5 lg:space-y-2">
          <div className="relative">
            <label className="input flex items-center gap-2 py-2.5">
              <span className="text-sm text-slate-400">🔎</span>
              <input
                className="w-full bg-transparent text-[13px] text-slate-700 outline-none dark:text-slate-200"
                placeholder="Area, landmark, or hotel"
                value={filters.city}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 140)}
                onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
              />
            </label>

            {/* Near Me Button */}
            <button
              type="button"
              onClick={getUserLocation}
              className={`tap-target mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                filters.city === "Near Me"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  : "border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s9 13 9 13-9-13-9-13-9zM12 14a4 4 0 1 1 0 0 1 0 0-1 0 0-1zM12 2v4M12 18v4" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {userLocation ? "Near Me" : "Use My Location"}
              </span>
            </button>

            {showSuggestions && (suggestionsLoading || hasSuggestions) ? (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
                {suggestionsLoading ? (
                  <p className="px-2 py-2 text-xs text-slate-500 dark:text-slate-300">Loading suggestions...</p>
                ) : (
                  <div className="space-y-2">
                    {suggestions.trendingCities.length ? (
                      <div>
                        <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Trending</p>
                        <div className="mt-1 flex flex-wrap gap-1.5 px-1">
                          {suggestions.trendingCities.slice(0, 4).map((city) => (
                            <button key={`trend-${city}`} type="button" onMouseDown={() => applySuggestion(city, "city")} className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {suggestions.cities.slice(0, 5).map((city) => (
                      <button key={`city-${city}`} type="button" onMouseDown={() => applySuggestion(city, "city")} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                        {city}
                      </button>
                    ))}

                    {suggestions.states.slice(0, 3).map((state) => (
                      <button key={`state-${state}`} type="button" onMouseDown={() => applySuggestion(state, "state")} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                        In state: {state}
                      </button>
                    ))}

                    {suggestions.hotels.slice(0, 3).map((hotel) => (
                      <button
                        key={hotel._id || hotel.name}
                        type="button"
                        onMouseDown={() => applySuggestion(hotel.location?.city || hotel.name, "city")}
                        className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {hotel.name} • {hotel.location?.city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <select className="input" value={filters.state} onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value }))}>
            <option value="">All states</option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Min price" type="number" value={filters.minPrice} onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))} />
            <input className="input" placeholder="Max price" type="number" value={filters.maxPrice} onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={filters.rating} onChange={(e) => setFilters((p) => ({ ...p, rating: e.target.value }))}>
              <option value="">Any rating</option>
              <option value="4">4+ rating</option>
              <option value="3">3+ rating</option>
            </select>
            <select className="input" value={filters.sortBy} onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value }))}>
              <option value="popularity">Popularity</option>
              <option value="price">Price low to high</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${selectedAmenities.includes(a) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}
              >
                {a}
              </button>
            ))}
          </div>

          <button type="submit" className="btn-primary w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm lg:py-3">Search</button>
          <button type="button" className="btn-secondary w-full border border-cyan-200/70 bg-white/80 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-900/70" onClick={saveCurrentAlert}>
            Save Search Alert
          </button>
        </form>

        {savedAlerts.length ? (
          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-slate-700/60 dark:bg-slate-900/70">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Saved alerts</p>
            <div className="space-y-1.5">
              {savedAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-2">
                  <button type="button" className="flex-1 rounded-lg bg-slate-100 px-2 py-1 text-left text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200" onClick={() => applySavedAlert(alert)}>
                    {alert.title}
                  </button>
                  <button type="button" className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:border-rose-700/60 dark:text-rose-300" onClick={() => deleteSavedAlert(alert.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-[11px] text-slate-500 dark:text-slate-400 lg:text-xs">Showing {hotelsForGrid.length} of {pagination.total || hotelsForGrid.length} hotels</p>
      </motion.section>

      <div className="space-y-3 lg:space-y-4">
        <div className="hidden items-center justify-between rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/65 dark:text-slate-300 lg:flex">
          <p className="font-semibold">{hotelsForGrid.length} stays matched</p>
          <p>Sorted by <span className="font-semibold">{filters.sortBy === "popularity" ? "Newest" : filters.sortBy === "price" ? "Price" : "Rating"}</span></p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blue-100/80 bg-blue-50/70 px-3 py-2 text-[11px] font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-blue-300">
          <span>{dynamicPricingBadge}</span>
          {showMap ? <span>Viewport: {viewportInfo.visibleCount} hotels • {viewportInfo.markerCount} markers • z{viewportInfo.zoom}</span> : null}
        </div>

        {showMap ? (
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200">
            <input type="checkbox" checked={mapDrivenSearch} onChange={(e) => setMapDrivenSearch(e.target.checked)} />
            Drag map to auto-filter hotel list in viewport
          </label>
        ) : null}

        {showMap ? (
          mapLoading ? (
            <section className="card flex h-52 items-center justify-center border-dashed border-slate-300 text-center text-[13px] text-slate-500 dark:border-slate-700 dark:text-slate-300 lg:h-[560px] lg:text-base">
              Loading map markers...
            </section>
          ) : (
            <HotelMap hotels={displayedMapHotels} title="Filtered India hotels" onViewportChange={onMapViewportChange} />
          )
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : hotelsForGrid.slice(0, mapDrivenSearch && showMap ? 60 : hotelsForGrid.length).map((hotel) => <HotelCard key={hotel._id} hotel={hotel} />)}
        </div>

        {!showMap && !mapDrivenSearch ? (
          <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center">
            {isLoadingMore ? <p className="text-xs font-semibold text-slate-500">Loading more stays...</p> : null}
            {!loading && pagination.page >= pagination.pages ? <p className="text-xs font-semibold text-slate-400">You have reached the end of the list.</p> : null}
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
