import { useCallback, useEffect, useMemo, useState } from "react";
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
  page: 1,
  limit: 8,
};

const amenities = ["WiFi", "AC", "Pool"];

export default function HotelsPage() {
  const savedAlertsKey = "hms_saved_search_alerts";
  const [params] = useSearchParams();
  const [scope, setScope] = useState("India");
  const [filters, setFilters] = useState({
    ...defaultFilters,
    city: params.get("city") || "",
  });
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [mapHotels, setMapHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapDrivenSearch, setMapDrivenSearch] = useState(false);
  const [viewportHotelIds, setViewportHotelIds] = useState([]);
  const [viewportInfo, setViewportInfo] = useState({ visibleCount: 0, markerCount: 0, zoom: 4 });
  const [savedAlerts, setSavedAlerts] = useState(() => {
    try {
      const raw = localStorage.getItem(savedAlertsKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchHotels = useCallback(async (mode = "page") => {
    if (mode === "map") {
      setMapLoading(true);
    } else {
      setLoading(true);
    }
    try {
      const query = {
        city: filters.city,
        state: filters.state,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        page: mode === "map" ? 1 : filters.page,
        limit: mode === "map" ? 1008 : filters.limit,
        sortBy: "createdAt",
        order: "desc",
      };

      const res = await api.get("/hotels", { params: query });
      if (mode === "map") {
        setMapHotels(res.data.data || []);
      } else {
        setHotels(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch {
      if (mode === "map") {
        setMapHotels([]);
      } else {
        setHotels([]);
        setPagination({ page: 1, pages: 1, total: 0 });
      }
    } finally {
      if (mode === "map") {
        setMapLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [filters.city, filters.state, filters.minPrice, filters.maxPrice, filters.rating, filters.page, filters.limit]);

  useEffect(() => {
    const city = params.get("city") || "";
    setFilters((prev) => ({ ...prev, city, page: 1 }));
  }, [params]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  useEffect(() => {
    if (!showMap) return;
    setMapLoading(true);
    fetchHotels("map");
  }, [showMap, fetchHotels]);

  useEffect(() => {
    localStorage.setItem(savedAlertsKey, JSON.stringify(savedAlerts.slice(0, 10)));
  }, [savedAlerts]);

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
    setFilters((p) => ({ ...p, page: 1 }));
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
    setFilters((prev) => ({ ...prev, ...alert.filters, page: 1 }));
  };

  const deleteSavedAlert = (id) => {
    setSavedAlerts((prev) => prev.filter((alert) => alert.id !== id));
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
          <label className="input flex items-center gap-2 py-2.5">
            <span className="text-sm text-slate-400">🔎</span>
            <input
              className="w-full bg-transparent text-[13px] text-slate-700 outline-none dark:text-slate-200"
              placeholder="Area, landmark, or hotel"
              value={filters.city}
              onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
            />
          </label>

          <select className="input" value={filters.state} onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value }))}>
            <option value="">All states</option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
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

        <p className="text-[11px] text-slate-500 dark:text-slate-400 lg:text-xs">Showing {displayedHotels.length} of {pagination.total || displayedHotels.length} hotels</p>
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

        {!mapDrivenSearch || !showMap ? (
        <div className="flex items-center justify-center gap-2.5 lg:gap-3">
          <button
            type="button"
            className="btn-secondary px-3.5 py-1.5 text-[12px] sm:px-4 sm:py-2 sm:text-sm lg:px-5 lg:py-2.5"
            disabled={pagination.page <= 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
          >
            Prev
          </button>
          <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 sm:text-sm lg:text-base">Page {pagination.page} / {pagination.pages || 1}</span>
          <button
            type="button"
            className="btn-secondary px-3.5 py-1.5 text-[12px] sm:px-4 sm:py-2 sm:text-sm lg:px-5 lg:py-2.5"
            disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </button>
        </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
