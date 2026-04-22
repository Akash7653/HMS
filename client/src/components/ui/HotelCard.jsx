import { Link } from "react-router-dom";
import { memo, useMemo, useState } from "react";

const FALLBACK_IMAGE = "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop";
const FALLBACK_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect fill='%23e2e8f0' width='800' height='450'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='24' font-family='system-ui'%3EHotel Image%3C/text%3E%3C/svg%3E";

function getOptimizedImageSet(rawSrc) {
  const src = rawSrc || FALLBACK_IMAGE;

  try {
    const url = new URL(src);
    if (!url.hostname.includes("images.unsplash.com")) {
      return {
        src,
        srcSet: "",
        sizes: "",
        placeholder: FALLBACK_PLACEHOLDER,
      };
    }

    const base = `${url.origin}${url.pathname}`;
    const make = (w, q) => `${base}?auto=format&fit=crop&w=${w}&q=${q}`;

    return {
      src: make(900, 74),
      srcSet: `${make(480, 60)} 480w, ${make(800, 70)} 800w, ${make(1200, 78)} 1200w`,
      sizes: "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw",
      placeholder: make(48, 30),
    };
  } catch {
    return {
      src: FALLBACK_IMAGE,
      srcSet: "",
      sizes: "",
      placeholder: FALLBACK_PLACEHOLDER,
    };
  }
}

function ProgressiveHotelImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const optimized = useMemo(() => getOptimizedImageSet(src), [src]);
  const displaySrc = failed ? FALLBACK_IMAGE : optimized.src;

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-200/70 dark:bg-slate-800/70 lg:h-48 xl:h-44 2xl:h-48">
      <img
        src={optimized.placeholder}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full scale-105 object-cover blur-md transition-opacity duration-400 ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <img
        src={displaySrc}
        srcSet={optimized.srcSet || undefined}
        sizes={optimized.sizes || undefined}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setFailed(true);
        }}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out ${loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"} group-hover:scale-[1.01]`}
      />
    </div>
  );
}

function HotelCard({ hotel }) {
  const minPrice = Math.min(...hotel.roomTypes.map((r) => r.basePrice));
  const stateLabel = hotel.location?.state || hotel.location?.city || "India";
  const now = new Date();
  const day = now.getDay();
  const month = now.getMonth() + 1;
  const isPeakMonth = [4, 5, 10, 11, 12].includes(month);
  const isWeekend = day === 0 || day === 6;
  const hasStrongDemand = (hotel.ratingAverage || 0) >= 4.4 && (hotel.ratingCount || 0) >= 60;
  const isValuePick = minPrice <= 3800 && (hotel.ratingAverage || 0) >= 4;

  let pricingBadge = "Stable pricing";
  let pricingBadgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (isPeakMonth && hasStrongDemand) {
    pricingBadge = "Likely to rise";
    pricingBadgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300";
  } else if (isWeekend && hasStrongDemand) {
    pricingBadge = "High weekend demand";
    pricingBadgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  } else if (isValuePick) {
    pricingBadge = "Best value now";
    pricingBadgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  } else if (isPeakMonth) {
    pricingBadge = "Seasonal pricing";
    pricingBadgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  }

  return (
    <article className="card group hover-lift overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}>
      <ProgressiveHotelImage src={hotel.images?.[0]} alt={hotel.name} />
      <div className="mt-2 space-y-1.5 lg:mt-2.5 lg:space-y-2">
        <h3 className="line-clamp-1 font-display text-[15px] font-semibold md:text-lg xl:text-[19px]">{hotel.name}</h3>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="rounded-full bg-cyan-50 px-2 py-1 font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">{stateLabel}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{hotel.location.city}, {hotel.location.country}</span>
          <span className="rounded-full bg-brand-100 px-2 py-1 font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
            {hotel.ratingAverage?.toFixed?.(1) || "0.0"} / 5
          </span>
          <span className={`rounded-full px-2 py-1 font-semibold ${pricingBadgeClass}`}>{pricingBadge}</span>
        </div>
        <div className="flex items-end justify-between pt-0.5">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 lg:text-xs">Per night from</p>
            <p className="text-[13px] font-bold text-brand-700 dark:text-brand-300 lg:text-[15px]">Rs. {minPrice}</p>
          </div>
          <Link to={`/hotels/${hotel._id}`} className="rounded-full bg-gradient-to-r from-[#0f274f] to-[#056ecf] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-blue-500/20 lg:px-4 lg:py-2 lg:text-xs">
            Select Room
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(HotelCard);
