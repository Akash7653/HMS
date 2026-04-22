import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";

const INDIA_CENTER = [20.5937, 78.9629];

function getRatingColor(rating) {
  if (rating >= 4.6) return { stroke: "#059669", fill: "#34d399" };
  if (rating >= 4.1) return { stroke: "#2563eb", fill: "#60a5fa" };
  if (rating >= 3.6) return { stroke: "#f59e0b", fill: "#fbbf24" };
  return { stroke: "#ef4444", fill: "#f87171" };
}

function FitBounds({ hotels }) {
  const map = useMap();

  useEffect(() => {
    const points = hotels
      .filter((hotel) => Number.isFinite(hotel.location?.coordinates?.lat) && Number.isFinite(hotel.location?.coordinates?.lng))
      .map((hotel) => [hotel.location.coordinates.lat, hotel.location.coordinates.lng]);

    if (!points.length) {
      map.setView(INDIA_CENTER, 4, { animate: true });
      return;
    }

    map.fitBounds(points, { animate: true, padding: [40, 40] });
  }, [hotels, map]);

  return null;
}

export default function HotelMap({ hotels, title = "Live hotel map" }) {
  const visibleHotels = useMemo(
    () => hotels.filter((hotel) => Number.isFinite(hotel.location?.coordinates?.lat) && Number.isFinite(hotel.location?.coordinates?.lng)),
    [hotels]
  );

  return (
    <section className="card space-y-3 border-blue-100/70 bg-white/80 p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900/70 lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Interactive map</p>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white lg:text-xl">{title}</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {visibleHotels.length} markers
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-inner dark:border-slate-700/60 dark:bg-slate-800/70">
        <MapContainer center={INDIA_CENTER} zoom={4} scrollWheelZoom={false} preferCanvas className="h-[420px] w-full lg:h-[560px]">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds hotels={visibleHotels} />
          {visibleHotels.map((hotel) => {
            const { stroke, fill } = getRatingColor(hotel.ratingAverage || 0);
            return (
              <CircleMarker
                key={hotel._id}
                center={[hotel.location.coordinates.lat, hotel.location.coordinates.lng]}
                pathOptions={{
                  color: stroke,
                  fillColor: fill,
                  fillOpacity: 0.9,
                  weight: 2,
                }}
                radius={7}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{hotel.name}</p>
                    <p className="text-xs text-slate-600">{hotel.location.city}, {hotel.location.state}</p>
                    <p className="text-xs text-slate-600">Rating: {hotel.ratingAverage?.toFixed?.(1) || "4.0"} / 5</p>
                    <p className="text-xs text-slate-600">From Rs. {Math.min(...hotel.roomTypes.map((room) => room.basePrice))}</p>
                    <Link to={`/hotels/${hotel._id}`} className="mt-2 inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      View Stay
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 lg:text-xs">
        Map markers are loaded from the seeded India-wide hotel catalog and can be filtered by state, city, price, and rating.
      </p>
    </section>
  );
}
