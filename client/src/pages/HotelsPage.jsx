import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../api";
import HotelCard from "../components/ui/HotelCard";
import SkeletonCard from "../components/ui/SkeletonCard";

const defaultFilters = {
  city: "",
  minPrice: "",
  maxPrice: "",
  rating: "",
  sortBy: "createdAt",
  order: "desc",
  page: 1,
  limit: 9,
};

export default function HotelsPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const queryParams = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
    [filters]
  );

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/hotels", { params: queryParams });
      setHotels(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      setHotels([]);
      setPagination({ page: 1, pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const onSearch = (e) => {
    e.preventDefault();
    setFilters((p) => ({ ...p, page: 1 }));
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-6 overflow-hidden px-4 py-6 md:py-7">
      <div className="absolute -right-36 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-400/15 blur-3xl dark:from-cyan-900/10 dark:to-blue-900/10" />
      <div className="absolute -bottom-28 -left-36 h-80 w-80 rounded-full bg-gradient-to-br from-brand-400/15 to-sky-400/15 blur-3xl dark:from-brand-900/10 dark:to-sky-900/10" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 space-y-1 text-center"
      >
        <h1 className="bg-gradient-to-r from-cyan-600 via-blue-600 to-brand-600 bg-clip-text font-display text-3xl font-bold text-transparent md:text-4xl">
          Discover Stays
        </h1>
        <p className="mx-auto max-w-xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
          Smart filters, live rates, and quick booking.
        </p>
      </motion.div>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        onSubmit={onSearch} 
        className="card relative z-10 grid gap-2.5 border border-white/40 bg-gradient-to-br from-white/80 to-slate-50/70 p-3.5 shadow-lg dark:border-slate-700/40 dark:from-slate-900/75 dark:to-slate-800/70 sm:grid-cols-2 lg:grid-cols-6 md:p-4"
      >
        <input 
          className="input h-10 bg-white/80 text-sm hover:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/80 dark:hover:bg-slate-700" 
          placeholder="City" 
          value={filters.city} 
          onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))} 
        />
        <input 
          className="input h-10 bg-white/80 text-sm hover:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/80 dark:hover:bg-slate-700" 
          placeholder="Min price" 
          type="number" 
          value={filters.minPrice} 
          onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))} 
        />
        <input 
          className="input h-10 bg-white/80 text-sm hover:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/80 dark:hover:bg-slate-700" 
          placeholder="Max price" 
          type="number" 
          value={filters.maxPrice} 
          onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))} 
        />
        <select 
          className="input h-10 bg-white/80 text-sm hover:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/80 dark:hover:bg-slate-700" 
          value={filters.rating} 
          onChange={(e) => setFilters((p) => ({ ...p, rating: e.target.value }))}
        >
          <option value="">Rating</option>
          <option value="4">4+</option>
          <option value="3">3+</option>
        </select>
        <select 
          className="input h-10 bg-white/80 text-sm hover:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/80 dark:hover:bg-slate-700" 
          value={filters.sortBy} 
          onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value }))}
        >
          <option value="createdAt">Newest</option>
          <option value="ratingAverage">Rating</option>
        </select>
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary h-10 bg-gradient-to-r from-blue-500 to-brand-600 text-sm font-semibold shadow-md hover:from-blue-600 hover:to-brand-700" 
          type="submit"
        >
          Search
        </motion.button>
      </motion.form>

      <div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          : hotels.map((hotel) => <HotelCard key={hotel._id} hotel={hotel} />)}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          type="button"
          className="btn-secondary h-10 w-full px-4 text-sm hover:bg-slate-200 sm:w-auto dark:hover:bg-slate-700"
          disabled={pagination.page <= 1}
          onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
        >
          ← Prev
        </button>
        <span className="rounded-lg bg-white/50 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          Page {pagination.page} / {pagination.pages || 1}
        </span>
        <button
          type="button"
          className="btn-secondary h-10 w-full px-4 text-sm hover:bg-slate-200 sm:w-auto dark:hover:bg-slate-700"
          disabled={pagination.page >= pagination.pages}
          onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
        >
          Next →
        </button>
      </motion.div>
    </div>
  );
}
