import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api";

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get("/payments/me").then((res) => setPayments(res.data.data));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="card overflow-hidden bg-gradient-to-br from-white via-slate-50 to-cyan-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">Billing</p>
            <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent sm:text-4xl">
              Payment History
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">All successful payments and refunds are tracked here.</p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm dark:bg-slate-800/70">
            <p className="text-xs uppercase tracking-wide text-slate-500">Transactions</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {payments.length === 0 ? (
          <div className="card text-center">
            <p className="font-semibold">No payments yet</p>
          </div>
        ) : (
          payments.map((p, index) => (
            <motion.article
              key={p._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="card overflow-hidden bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
            >
              <div className="grid gap-4 lg:grid-cols-[120px_1fr_auto] lg:items-center">
                <img
                  src={p.hotel?.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"}
                  alt={p.hotel?.name || "Hotel"}
                  className="h-24 w-full rounded-2xl object-cover shadow-md"
                />
                <div>
                  <h2 className="font-display text-lg font-semibold sm:text-xl">{p.hotel?.name || "Hotel"}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Ref: {p.reference}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Method: {p.paymentMethod}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Date: {new Date(p.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">Rs. {p.amount}</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      p.status === "paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : p.status === "refunded"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
}
