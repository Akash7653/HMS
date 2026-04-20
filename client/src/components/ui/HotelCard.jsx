import { Link } from "react-router-dom";
import { memo, useMemo, useState } from "react";

const FALLBACK_IMAGE = "https://placehold.co/800x450?text=Hotel";

function getOptimizedImageSet(rawSrc) {
  const src = rawSrc || FALLBACK_IMAGE;

  try {
    const url = new URL(src);
    if (!url.hostname.includes("images.unsplash.com")) {
      return {
        src,
        srcSet: "",
        sizes: "",
        placeholder: src,
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
      src,
      srcSet: "",
      sizes: "",
      placeholder: src,
    };
  }
}

function ProgressiveHotelImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const optimized = useMemo(() => getOptimizedImageSet(src), [src]);

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-200/70 dark:bg-slate-800/70">
      <img
        src={optimized.placeholder}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full scale-105 object-cover blur-md transition-opacity duration-400 ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <img
        src={optimized.src}
        srcSet={optimized.srcSet || undefined}
        sizes={optimized.sizes || undefined}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out ${loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"} group-hover:scale-[1.01]`}
      />
    </div>
  );
}

function HotelCard({ hotel }) {
  const minPrice = Math.min(...hotel.roomTypes.map((r) => r.basePrice));

  return (
    <article className="card group hover-lift overflow-hidden" style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}>
      <ProgressiveHotelImage src={hotel.images?.[0]} alt={hotel.name} />
      <div className="mt-2.5 space-y-1.5">
        <h3 className="line-clamp-1 font-display text-base font-semibold md:text-lg">{hotel.name}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 md:text-sm">
          {hotel.location.city}, {hotel.location.country}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">From Rs. {minPrice}/night</p>
          <span className="rounded-full bg-brand-100 px-2 py-1 text-[11px] font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
            {hotel.ratingAverage?.toFixed?.(1) || "0.0"} / 5
          </span>
        </div>
        <Link to={`/hotels/${hotel._id}`} className="btn-primary inline-block w-full py-2 text-center text-sm">
          View Details
        </Link>
      </div>
    </article>
  );
}

export default memo(HotelCard);
