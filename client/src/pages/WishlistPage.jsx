import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function WishlistPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/wishlist").then((res) => setItems(res.data.data));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text font-display text-3xl font-bold text-transparent">Wishlist</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((hotel) => (
          <article key={hotel._id} className="card">
            <img src={hotel.images?.[0]} alt={hotel.name} className="h-40 w-full rounded-xl object-cover" loading="lazy" />
            <h2 className="mt-3 font-semibold">{hotel.name}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{hotel.location.city}</p>
            <Link to={`/hotels/${hotel._id}`} className="btn-primary mt-3 inline-block w-full text-center">View</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
