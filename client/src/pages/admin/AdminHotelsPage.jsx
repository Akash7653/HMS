import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api";

const initialForm = {
  name: "",
  description: "",
  city: "",
  address: "",
  country: "",
  amenities: "WiFi,Pool",
};

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [form, setForm] = useState(initialForm);

  const fetchHotels = async () => {
    const res = await api.get("/hotels", { params: { limit: 50 } });
    setHotels(res.data.data);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const createHotel = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/hotels", {
        name: form.name,
        description: form.description,
        location: { city: form.city, address: form.address, country: form.country },
        amenities: form.amenities.split(",").map((x) => x.trim()),
        images: ["https://placehold.co/1200x800?text=Hotel"],
        roomTypes: [
          { type: "Single", basePrice: 3000, totalRooms: 10 },
          { type: "Double", basePrice: 5000, totalRooms: 8 },
          { type: "Suite", basePrice: 8000, totalRooms: 4 },
        ],
      });
      toast.success("Hotel created");
      setForm(initialForm);
      fetchHotels();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create hotel");
    }
  };

  const deactivateHotel = async (id) => {
    await api.delete(`/admin/hotels/${id}`);
    toast.success("Hotel deactivated");
    fetchHotels();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={createHotel} className="card space-y-2">
        <h2 className="font-display text-xl font-semibold">Add Hotel</h2>
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <textarea className="input min-h-24" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input className="input" placeholder="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required />
          <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required />
          <input className="input" placeholder="Country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} required />
        </div>
        <input className="input" placeholder="Amenities comma separated" value={form.amenities} onChange={(e) => setForm((p) => ({ ...p, amenities: e.target.value }))} />
        <button className="btn-primary" type="submit">Create</button>
      </form>

      <section className="space-y-2">
        {hotels.map((h) => (
          <article key={h._id} className="card flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">{h.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{h.location.city} | Rating {h.ratingAverage || 0}</p>
            </div>
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => deactivateHotel(h._id)}>
              Deactivate
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
