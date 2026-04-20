import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import BrandLogo from "../components/ui/BrandLogo";

const stats = [
  { label: "Hotels", to: 3400, suffix: "+" },
  { label: "Cities", to: 120 },
  { label: "Avg. Confirm", to: 34, suffix: " sec" },
  { label: "Guest Score", to: 4.8, suffix: "/5", decimals: 1 },
];

const stackCards = [
  {
    title: "Discovery",
    description: "Search hotels with fast city, price, and rating filters.",
  },
  {
    title: "Pricing",
    description: "Check live rates and room availability before checkout.",
  },
  {
    title: "Checkout",
    description: "Complete payments securely with instant booking updates.",
  },
];

const steps = [
  {
    index: "01",
    title: "Pick Your Stay",
    body: "Scan photos, ratings, amenities, and room options in seconds.",
  },
  {
    index: "02",
    title: "Confirm Dates",
    body: "Live availability checks keep inventory accurate in real time.",
  },
  {
    index: "03",
    title: "Book Confidently",
    body: "Pay securely and receive booking details instantly.",
  },
];

const stayTypes = [
  {
    title: "Budget Stays",
    summary: "Clean and reliable stays for short trips and practical travel budgets.",
    highlights: "Best for students, solo travel, and quick city visits.",
  },
  {
    title: "Business Hotels",
    summary: "Fast check-in, work-friendly rooms, and central locations near hubs.",
    highlights: "Best for meetings, conferences, and weekday travel.",
  },
  {
    title: "Luxury Resorts",
    summary: "Premium rooms, spa experiences, and curated amenities for leisure stays.",
    highlights: "Best for vacations, couples, and celebration trips.",
  },
];

const faqs = [
  {
    q: "How do I know if a room is really available?",
    a: "Horizon HMS validates room inventory in real time before confirmation so overlapping bookings are blocked.",
  },
  {
    q: "When will I receive booking details?",
    a: "After successful payment, booking details are shared instantly in your account and notification channels.",
  },
  {
    q: "Can I cancel bookings from the platform?",
    a: "Yes. You can cancel from booking history and refund status updates are reflected in payment history.",
  },
];

const topDestinations = [
  {
    city: "Goa",
    avgPrice: "Rs. 6,900",
    occupancy: "89%",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=75",
  },
  {
    city: "Bengaluru",
    avgPrice: "Rs. 5,200",
    occupancy: "76%",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=75",
  },
  {
    city: "Mumbai",
    avgPrice: "Rs. 8,450",
    occupancy: "92%",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=75",
    fallbackImage: "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1200&q=75",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

function AnimatedCounter({ to, suffix = "", decimals = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 1200;
    const stepTime = 16;
    const steps = Math.max(Math.round(duration / stepTime), 1);
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const progress = Math.min(currentStep / steps, 1);
      setValue(to * progress);

      if (progress >= 1) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, to]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="relative overflow-hidden pb-10">
      <div className="landing-noise absolute inset-0 opacity-70" />
      <div className="orb left-[-80px] top-6 h-56 w-56 bg-cyan-300/60 dark:bg-cyan-500/25" />
      <div className="orb right-[-120px] top-24 h-80 w-80 bg-amber-300/50 dark:bg-amber-700/20" />

      <section className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-14">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.45 }}
          className="space-y-5"
        >
          <h1 className="font-display text-3xl font-bold leading-[1.08] sm:text-4xl md:text-6xl">
            Stays that feel
            <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-amber-500 bg-clip-text text-transparent">
              fast, premium, effortless
            </span>
          </h1>
          <p className="max-w-xl text-base text-slate-700 dark:text-slate-300 md:text-lg">
            Horizon HMS combines smart search, live pricing, and secure checkout in one smooth travel flow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/hotels" className="btn-primary px-6 py-3 text-base">
              Explore Stays
            </Link>
            <Link to="/register" className="btn-secondary px-6 py-3 text-base">
              Create Account
            </Link>
          </div>
        </motion.div>

        <motion.aside
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, delay: 0.08 }}
          className="neon-frame relative overflow-hidden rounded-3xl border border-white/40 bg-white/72 p-5 shadow-xl backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-900/72"
        >
            <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-cyan-200/55 blur-2xl dark:bg-cyan-700/25" />
            <div className="relative space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Real-time Pulse</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/60 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/65">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Search Uplift</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-700 dark:text-cyan-300">+18.4%</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/65">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Bookings Today</p>
                  <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">12,908</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/65">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Top City</p>
                  <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">Mumbai</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/65">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Avg Confirm</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">34 sec</p>
                </div>
              </div>
            </div>
        </motion.aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="grid gap-3 md:grid-cols-4">
          {stats.map((item, idx) => (
            <motion.article
              key={item.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className="rounded-2xl border border-white/40 bg-white/75 p-4 backdrop-blur-md dark:border-slate-700/40 dark:bg-slate-900/55"
            >
              <p className="text-[11px] uppercase tracking-[0.13em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
                <AnimatedCounter to={item.to} suffix={item.suffix} decimals={item.decimals} />
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stackCards.map((item, idx) => (
            <motion.article
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="card border-brand-100/50 p-5 dark:border-brand-900/30"
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">{item.title}</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.description}</p>
            </motion.article>
          ))}
        </div>
        </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="card overflow-hidden border-cyan-200/60 bg-gradient-to-r from-cyan-600 via-blue-600 to-brand-700 p-6 text-white sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">How It Works</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.index} className="rounded-2xl border border-white/35 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold tracking-[0.15em] text-cyan-100">{step.index}</p>
                <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-cyan-50">{step.body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="space-y-2"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">Hotel Guide</p>
          <h3 className="font-display text-2xl font-bold md:text-3xl">Choose the right stay type for your trip</h3>
        </motion.div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {stayTypes.map((item, idx) => (
            <motion.article
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="card p-5"
            >
              <h4 className="text-lg font-bold">{item.title}</h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.summary}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700 dark:text-brand-300">{item.highlights}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="space-y-2"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">Top Destinations</p>
          <h3 className="font-display text-2xl font-bold md:text-3xl">Popular cities travelers are booking now</h3>
        </motion.div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {topDestinations.map((item, idx) => (
            <motion.article
              key={item.city}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="card overflow-hidden p-0"
            >
              <img
                src={item.image}
                alt={item.city}
                className="h-40 w-full object-cover sm:h-44"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  const backup = item.fallbackImage;
                  const current = target.getAttribute("src") || "";

                  if (backup && current !== backup) {
                    target.src = backup;
                    return;
                  }

                  target.src = `https://placehold.co/1200x800?text=${encodeURIComponent(item.city)}`;
                }}
              />
              <div className="space-y-2 p-4">
                <h4 className="text-lg font-bold">{item.city}</h4>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600 dark:text-slate-300">Avg Price</p>
                  <p className="font-semibold text-brand-700 dark:text-brand-300">{item.avgPrice}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600 dark:text-slate-300">Occupancy</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">{item.occupancy}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="space-y-2"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">FAQs</p>
          <h3 className="font-display text-2xl font-bold md:text-3xl">What guests ask before booking</h3>
        </motion.div>

        <div className="mt-5 grid gap-3">
          {faqs.map((item, idx) => (
            <motion.article
              key={item.q}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="card p-5"
            >
              <h4 className="text-base font-bold">{item.q}</h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.a}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="card overflow-hidden border-amber-200/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white sm:p-8 dark:border-amber-700/40"
        >
          <h3 className="font-display text-2xl font-bold md:text-3xl">Ready to lock your next stay?</h3>
          <p className="mt-2 max-w-2xl text-slate-200">
            Compare options quickly, pay securely, and get confirmation in moments.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/hotels" className="rounded-xl bg-white px-5 py-3 font-bold text-slate-900 transition hover:bg-slate-100">
              Explore Hotels
            </Link>
            <Link to="/register" className="rounded-xl border border-white/70 px-5 py-3 font-bold text-white transition hover:bg-white/15">
              Create Account
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
