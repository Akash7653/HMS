import { useState } from "react";
import AdminDashboardPage from "./admin/AdminDashboardPage";
import AdminHotelsPage from "./admin/AdminHotelsPage";
import AdminBookingsPage from "./admin/AdminBookingsPage";

const tabs = ["dashboard", "hotels", "bookings"];

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin Panel</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`${tab === t ? "btn-primary" : "btn-secondary"} w-full sm:w-auto`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <AdminDashboardPage />}
      {tab === "hotels" && <AdminHotelsPage />}
      {tab === "bookings" && <AdminBookingsPage />}
    </div>
  );
}
