import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../../api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics").then((res) => setAnalytics(res.data));
  }, []);

  if (!analytics) return <div className="p-6">Loading analytics...</div>;

  const chartData = {
    labels: analytics.popularRooms.map((r) => r._id),
    datasets: [
      {
        label: "Bookings",
        data: analytics.popularRooms.map((r) => r.count),
        backgroundColor: "rgba(56, 146, 239, 0.7)",
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <article className="card"><h3 className="text-sm">Hotels</h3><p className="text-2xl font-bold">{analytics.activeHotels}</p></article>
        <article className="card"><h3 className="text-sm">Cities</h3><p className="text-2xl font-bold">{analytics.cityCount}</p></article>
        <article className="card"><h3 className="text-sm">Revenue</h3><p className="text-2xl font-bold">Rs. {analytics.totalRevenue}</p></article>
        <article className="card"><h3 className="text-sm">Occupancy Rate</h3><p className="text-2xl font-bold">{analytics.occupancyRate}%</p></article>
        <article className="card"><h3 className="text-sm">Confirmed Bookings</h3><p className="text-2xl font-bold">{analytics.confirmedBookings}</p></article>
      </div>
      <article className="card">
        <h3 className="mb-3 font-semibold">Popular Room Types</h3>
        <Bar data={chartData} />
      </article>
    </div>
  );
}
