import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
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

function ViewportObserver({ onChange }) {
  const debounceRef = useRef(null);

  const emitViewport = (map) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      onChange({ bounds, zoom: map.getZoom() });
    }, 180);
  };

  const map = useMapEvents({
    moveend: () => {
      emitViewport(map);
    },
    zoomend: () => {
      emitViewport(map);
    },
  });

  useEffect(() => {
    emitViewport(map);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, onChange]);

  return null;
}

function getClusterCellSize(zoom) {
  if (zoom <= 4) return 2.3;
  if (zoom <= 5) return 1.5;
  if (zoom <= 6) return 1.05;
  if (zoom <= 7) return 0.65;
  if (zoom <= 8) return 0.4;
  return 0;
}

function getMarkerBudget(zoom) {
  if (zoom <= 4) return 160;
  if (zoom <= 6) return 220;
  if (zoom <= 8) return 320;
  if (zoom <= 10) return 440;
  return 560;
}

function buildClusteredMarkers(hotels, zoom) {
  const cellSize = getClusterCellSize(zoom);
  if (!cellSize) {
    return hotels.map((hotel) => ({
      key: hotel._id,
      type: "hotel",
      hotels: [hotel],
      lat: hotel.location.coordinates.lat,
      lng: hotel.location.coordinates.lng,
    }));
  }

  const buckets = new Map();

  hotels.forEach((hotel) => {
    const lat = hotel.location.coordinates.lat;
    const lng = hotel.location.coordinates.lng;
    const latCell = Math.floor(lat / cellSize);
    const lngCell = Math.floor(lng / cellSize);
    const bucketKey = `${latCell}:${lngCell}`;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        key: bucketKey,
        type: "cluster",
        hotels: [],
        latSum: 0,
        lngSum: 0,
      });
    }

    const bucket = buckets.get(bucketKey);
    bucket.hotels.push(hotel);
    bucket.latSum += lat;
    bucket.lngSum += lng;
  });

  return Array.from(buckets.values()).map((bucket) => {
    if (bucket.hotels.length === 1) {
      const hotel = bucket.hotels[0];
      return {
        key: hotel._id,
        type: "hotel",
        hotels: [hotel],
        lat: hotel.location.coordinates.lat,
        lng: hotel.location.coordinates.lng,
      };
    }

    return {
      key: `cluster-${bucket.key}`,
      type: "cluster",
      hotels: bucket.hotels,
      lat: bucket.latSum / bucket.hotels.length,
      lng: bucket.lngSum / bucket.hotels.length,
    };
  });
}

export default function HotelMap({ hotels, title = "Live hotel map", onViewportChange }) {
  const visibleHotels = useMemo(
    () => hotels.filter((hotel) => Number.isFinite(hotel.location?.coordinates?.lat) && Number.isFinite(hotel.location?.coordinates?.lng)),
    [hotels]
  );

  const [viewport, setViewport] = useState({ bounds: null, zoom: 4 });

  const hotelsInViewport = useMemo(() => {
    if (!viewport.bounds) return visibleHotels;

    return visibleHotels.filter((hotel) => {
      const lat = hotel.location.coordinates.lat;
      const lng = hotel.location.coordinates.lng;
      return viewport.bounds.contains([lat, lng]);
    });
  }, [visibleHotels, viewport.bounds]);

  const markers = useMemo(
    () => buildClusteredMarkers(hotelsInViewport, viewport.zoom),
    [hotelsInViewport, viewport.zoom]
  );

  const virtualizedMarkers = useMemo(() => {
    const budget = getMarkerBudget(viewport.zoom);
    if (markers.length <= budget) return markers;

    const step = Math.ceil(markers.length / budget);
    return markers.filter((_, index) => index % step === 0);
  }, [markers, viewport.zoom]);

  useEffect(() => {
    if (!onViewportChange) return;
    onViewportChange({
      zoom: viewport.zoom,
      visibleHotels: hotelsInViewport,
      visibleHotelIds: hotelsInViewport.map((hotel) => hotel._id),
      visibleCount: hotelsInViewport.length,
      markerCount: virtualizedMarkers.length,
    });
  }, [hotelsInViewport, onViewportChange, viewport.zoom, virtualizedMarkers.length]);

  return (
    <section className="card space-y-3 border-blue-100/70 bg-white/80 p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900/70 lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Interactive map</p>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white lg:text-xl">{title}</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {virtualizedMarkers.length} markers
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-inner dark:border-slate-700/60 dark:bg-slate-800/70">
        <MapContainer center={INDIA_CENTER} zoom={4} scrollWheelZoom={false} preferCanvas className="h-[420px] w-full lg:h-[560px]">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ViewportObserver onChange={setViewport} />
          <FitBounds hotels={visibleHotels} />
          {virtualizedMarkers.map((marker) => {
            if (marker.type === "cluster" && marker.hotels.length > 1) {
              const radius = Math.min(22, 8 + Math.log2(marker.hotels.length + 1) * 3);
              return (
                <CircleMarker
                  key={marker.key}
                  center={[marker.lat, marker.lng]}
                  pathOptions={{
                    color: "#0f172a",
                    fillColor: "#2563eb",
                    fillOpacity: 0.82,
                    weight: 2,
                  }}
                  radius={radius}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{marker.hotels.length} hotels in this area</p>
                      <p className="text-xs text-slate-600">Zoom in for individual hotels.</p>
                      <ul className="max-h-24 space-y-1 overflow-auto text-xs text-slate-600">
                        {marker.hotels.slice(0, 4).map((hotel) => (
                          <li key={hotel._id}>{hotel.name}</li>
                        ))}
                      </ul>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            }

            const hotel = marker.hotels[0];
            const { stroke, fill } = getRatingColor(hotel.ratingAverage || 0);
            return (
              <CircleMarker
                key={marker.key}
                center={[marker.lat, marker.lng]}
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
        Map markers are clustered, virtualized, and viewport updates are debounced for smoother rendering on low-end phones.
      </p>
    </section>
  );
}
