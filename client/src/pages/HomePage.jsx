import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";

const offers = [
  { title: "Summer Escape", subtitle: "Up to 35% off on beach stays", code: "BEACH35", color: "from-orange-500 to-rose-500" },
  { title: "Weekend Smart", subtitle: "Extra 10% on 2+ night booking", code: "SAVE10", color: "from-cyan-500 to-blue-600" },
  { title: "Business Lite", subtitle: "Breakfast + WiFi included", code: "WORKNOW", color: "from-emerald-500 to-teal-600" },
];

const cities = [
  {
    name: "Goa",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=75",
  },
  {
    name: "Mumbai",
    image: "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=900&q=75",
  },
  {
    name: "Jaipur",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=75",
  },
  {
    name: "Bengaluru",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=900&q=75",
  },
];

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const ms = outDate - inDate;
  return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [tripScope, setTripScope] = useState("India");
  const [search, setSearch] = useState({
    destination: "",
    checkIn: "",
    checkOut: "",
    guests: 2,
  });
  const [recommendedHotels, setRecommendedHotels] = useState([]);
  const [hotelCount, setHotelCount] = useState(120);

  useEffect(() => {
    api.get("/hotels", { params: { page: 1, limit: 6, sortBy: "ratingAverage", order: "desc" } })
      .then((res) => {
        const hotels = res.data?.data || [];
        const total = res.data?.pagination?.total || hotels.length;
        setRecommendedHotels(hotels);
        setHotelCount(total > 0 ? total : 120);
      })
      .catch(() => {
        setRecommendedHotels([]);
        setHotelCount(120);
      });
  }, []);

  const searchNights = useMemo(() => nightsBetween(search.checkIn, search.checkOut), [search.checkIn, search.checkOut]);

  const onNearMe = () => {
    if (!navigator.geolocation) {
      setSearch((p) => ({ ...p, destination: "Near Me" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setSearch((p) => ({ ...p, destination: "Near Me" })),
      () => setSearch((p) => ({ ...p, destination: "Near Me" }))
    );
  };

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.destination.trim()) params.set("city", search.destination.trim());
    if (search.checkIn) params.set("checkIn", search.checkIn);
    if (search.checkOut) params.set("checkOut", search.checkOut);
    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-3 py-3 pb-16 md:space-y-8 md:px-4 md:py-7 md:pb-10">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden border-blue-100/70 bg-gradient-to-br from-[#eaf4ff] via-white to-[#f7fbff] p-3.5 dark:border-slate-700/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-5">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">Horizon-Hotels</p>
            <h1 className="font-display text-[23px] font-bold leading-tight text-slate-900 dark:text-white sm:text-2xl">Find your next stay</h1>
          </div>
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">{hotelCount}+ hotels</span>
        </div>

        <div className="mb-2.5 inline-flex rounded-full border border-blue-200 bg-blue-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/70">
          {["India", "International"].map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setTripScope(scope)}
              className={`rounded-full px-3.5 py-1 text-[11px] font-semibold ${tripScope === scope ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-slate-600 dark:text-slate-300"}`}
            >
              {scope}
            </button>
          ))}
        </div>

        <form onSubmit={onSearch} className="space-y-1.5">
          <label className="input flex items-center gap-2 py-2.5">
            <span className="text-sm text-slate-400">📍</span>
            <input
              className="w-full bg-transparent text-[13px] text-slate-700 outline-none dark:text-slate-200"
              placeholder="Area, landmark, or hotel"
              value={search.destination}
              onChange={(e) => setSearch((p) => ({ ...p, destination: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Start Date
              <input className="input mt-1" type="date" value={search.checkIn} onChange={(e) => setSearch((p) => ({ ...p, checkIn: e.target.value }))} />
            </label>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              End Date
              <input className="input mt-1" type="date" value={search.checkOut} onChange={(e) => setSearch((p) => ({ ...p, checkOut: e.target.value }))} />
            </label>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select className="input" value={search.guests} onChange={(e) => setSearch((p) => ({ ...p, guests: Number(e.target.value) }))}>
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests</option>
            </select>
            <button type="button" className="btn-secondary whitespace-nowrap px-4" onClick={onNearMe}>Near Me</button>
          </div>
          <button type="submit" className="btn-primary w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-bold sm:py-3 sm:text-base">
            Search Hotels
          </button>
          {searchNights > 0 ? <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{searchNights} nights selected</p> : null}
        </form>
      </motion.section>

      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold sm:text-lg">Deals for you</h2>
          <span className="text-[11px] font-semibold text-blue-600">Swipe</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {offers.map((offer) => (
            <article key={offer.code} className={`min-w-[258px] rounded-2xl bg-gradient-to-br ${offer.color} p-4 text-white shadow-lg`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">Offer</p>
              <h3 className="mt-1 text-base font-bold sm:text-lg">{offer.title}</h3>
              <p className="mt-1 text-[13px] text-white/90">{offer.subtitle}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="inline-flex rounded-full bg-white/20 px-2 py-1 text-[11px] font-bold">Code: {offer.code}</p>
                <button type="button" className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-800">Apply</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-1.5">
        <h2 className="font-display text-base font-bold sm:text-lg">Popular destinations</h2>
        <div className="grid grid-cols-2 gap-3">
          {cities.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => navigate(`/hotels?city=${encodeURIComponent(city.name)}`)}
              className="group relative overflow-hidden rounded-2xl"
            >
              <img src={city.image} alt={city.name} className="h-24 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-28" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/10 to-transparent" />
              <p className="absolute bottom-2 left-2 text-[13px] font-bold text-white sm:text-sm">{city.name}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold sm:text-lg">Recommended hotels</h2>
          <Link to="/hotels" className="text-[11px] font-semibold text-blue-600">View all</Link>
        </div>

        <div className="space-y-3">
          {recommendedHotels.map((hotel) => {
            const minPrice = Math.min(...hotel.roomTypes.map((room) => room.basePrice));
            return (
              <article key={hotel._id} className="card overflow-hidden border-white/50 bg-white/85 p-0 dark:border-slate-700 dark:bg-slate-900/70">
                <img src={hotel.images?.[0]} alt={hotel.name} className="h-36 w-full object-cover" loading="lazy" />
                <div className="space-y-1.5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-[15px] font-bold sm:text-base">{hotel.name}</h3>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{hotel.ratingAverage?.toFixed?.(1) || "4.0"}</span>
                  </div>
                  <p className="text-[12px] text-slate-600 dark:text-slate-300 sm:text-sm">{hotel.location?.city}, {hotel.location?.country}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Per night from</p>
                      <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300 sm:text-sm">Rs. {minPrice}</p>
                    </div>
                    <Link to={`/hotels/${hotel._id}`} className="btn-primary bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-[11px]">View Deal</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
