import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import HotelCard from "../components/ui/HotelCard";
import SkeletonCard from "../components/ui/SkeletonCard";

const defaultFilters = {
  city: "",
  minPrice: "",
  maxPrice: "",
  rating: "",
  sortBy: "popularity",
  page: 1,
  limit: 8,
};

const amenities = ["WiFi", "AC", "Pool"];

export default function HotelsPage() {
  const [params] = useSearchParams();
  const [scope, setScope] = useState("India");
  const [filters, setFilters] = useState({
    ...defaultFilters,
    city: params.get("city") || "",
  });
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        city: filters.city,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        page: filters.page,
        limit: filters.limit,
        sortBy: "createdAt",
        order: "desc",
      };

      const res = await api.get("/hotels", { params: query });
      setHotels(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      setHotels([]);
      setPagination({ page: 1, pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters.city, filters.minPrice, filters.maxPrice, filters.rating, filters.page, filters.limit]);

  useEffect(() => {
    const city = params.get("city") || "";
    setFilters((prev) => ({ ...prev, city, page: 1 }));
  }, [params]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const displayedHotels = useMemo(() => {
    let result = [...hotels];

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
  }, [hotels, selectedAmenities, filters.sortBy]);

  const onSearch = (e) => {
    e.preventDefault();
    setFilters((p) => ({ ...p, page: 1 }));
  };

  const toggleAmenity = (name) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-3 px-3 py-3 pb-16 md:space-y-6 md:px-4 md:py-7 md:pb-8">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card space-y-2.5 border-blue-100/70 bg-gradient-to-br from-[#e9f3ff] via-white to-[#f7fbff] p-3.5 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[22px] font-bold sm:text-2xl">Hotel Listings</h1>
          <button type="button" onClick={() => setShowMap((v) => !v)} className="btn-secondary px-3 py-1.5 text-[11px]">
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

        <form onSubmit={onSearch} className="space-y-1.5">
          <label className="input flex items-center gap-2 py-2.5">
            <span className="text-sm text-slate-400">🔎</span>
            <input
              className="w-full bg-transparent text-[13px] text-slate-700 outline-none dark:text-slate-200"
              placeholder="Area, landmark, or hotel"
              value={filters.city}
              onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
            />
          </label>

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

          <button type="submit" className="btn-primary w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm">Search</button>
        </form>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">Showing {displayedHotels.length} of {pagination.total || displayedHotels.length} hotels</p>
      </motion.section>

      {showMap ? (
        <section className="card flex h-40 items-center justify-center border-dashed border-slate-300 text-center text-[13px] text-slate-500 dark:border-slate-700 dark:text-slate-300 sm:h-44 sm:text-sm">
          Interactive map can be connected here. Tap any card below to open details.
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : displayedHotels.map((hotel) => <HotelCard key={hotel._id} hotel={hotel} />)}
      </div>

      <div className="flex items-center justify-center gap-2.5">
        <button
          type="button"
          className="btn-secondary px-3.5 py-1.5 text-[12px] sm:px-4 sm:py-2 sm:text-sm"
          disabled={pagination.page <= 1}
          onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
        >
          Prev
        </button>
        <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 sm:text-sm">Page {pagination.page} / {pagination.pages || 1}</span>
        <button
          type="button"
          className="btn-secondary px-3.5 py-1.5 text-[12px] sm:px-4 sm:py-2 sm:text-sm"
          disabled={pagination.page >= pagination.pages}
          onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
