import { useEffect, useMemo, useState, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/ui/Navbar";
import MobileBottomNav from "./components/ui/MobileBottomNav";
import GlobalFooter from "./components/ui/GlobalFooter";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import HomePage from "./pages/HomePage";
import HotelsPage from "./pages/HotelsPage";
import HotelDetailsPage from "./pages/HotelDetailsPage";
import BookingCheckoutPage from "./pages/BookingCheckoutPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingHistoryPage from "./pages/BookingHistoryPage";
import PaymentHistoryPage from "./pages/PaymentHistoryPage";
import WishlistPage from "./pages/WishlistPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import AiChatWidget from "./components/ui/AiChatWidget";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(localStorage.getItem("hms_theme") === "dark");
  const [showSplash, setShowSplash] = useState(() => window.innerWidth < 768 && !sessionStorage.getItem("hms_mobile_splash_seen"));
  const [qaDebugMode, setQaDebugMode] = useState(localStorage.getItem("hms_qa_debug") === "true");
  const rafRef = useRef(null);

  const hideBottomNav = useMemo(
    () => location.pathname.startsWith("/admin"),
    [location.pathname]
  );

  const hideAiChat = useMemo(
    () =>
      location.pathname.startsWith("/login") ||
      location.pathname.startsWith("/register") ||
      location.pathname.startsWith("/checkout") ||
      location.pathname.startsWith("/confirmation"),
    [location.pathname]
  );

  const hideFooter = Boolean(
    location.pathname.startsWith("/login") ||
      location.pathname.startsWith("/register") ||
      (user && location.pathname.startsWith("/hotels"))
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("hms_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("hms_mobile_splash_seen", "1");
    }, 1450);
    return () => clearTimeout(timer);
  }, [showSplash]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  // QA Debug Mode: Keyboard shortcut (Ctrl+Shift+Q) to toggle safe-area visualization
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Q") {
        e.preventDefault();
        setQaDebugMode((prev) => {
          const newMode = !prev;
          localStorage.setItem("hms_qa_debug", newMode ? "true" : "false");
          console.log(
            newMode
              ? "%c✅ QA DEBUG MODE ENABLED\n%cPress Ctrl+Shift+Q to disable\nInspecting: Safe-area insets, tap-target zones, and gesture-nav safe areas"
              : "%c❌ QA DEBUG MODE DISABLED",
            newMode ? "color: #22c55e; font-weight: bold; font-size: 14px;" : "color: #ef4444; font-weight: bold; font-size: 14px;",
            "color: #60a5fa; font-size: 12px;"
          );
          return newMode;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // QA Debug mode: update root element and render safe-area panel
  useEffect(() => {
    if (qaDebugMode) {
      document.documentElement.setAttribute("data-qa-debug", "true");

      // Highlight all tap-target elements
      const updateTapTargetOverlays = () => {
        document.querySelectorAll(".tap-target").forEach((el) => {
          el.classList.add("qa-tap-target");
        });
      };
      updateTapTargetOverlays();

      // Create safe-area display panel
      let panel = document.getElementById("qa-safe-area-panel-root");
      if (!panel) {
        panel = document.createElement("div");
        panel.id = "qa-safe-area-panel-root";
        panel.className = "qa-safe-area-panel";
        document.body.appendChild(panel);

        const updateSafeAreaValues = () => {
          const root = document.documentElement;
          const top = getComputedStyle(root).getPropertyValue("--safe-area-inset-top").trim() || "0px";
          const right = getComputedStyle(root).getPropertyValue("--safe-area-inset-right").trim() || "0px";
          const bottom = getComputedStyle(root).getPropertyValue("--safe-bottom").trim() || "0px";
          const left = getComputedStyle(root).getPropertyValue("--safe-area-inset-left").trim() || "0px";
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          panel.innerHTML = `
            <div><span class="label">SAFE-AREA INSETS</span></div>
            <div>Top: <span class="value">${top}</span></div>
            <div>Right: <span class="value">${right}</span></div>
            <div>Bottom: <span class="value">${bottom}</span></div>
            <div>Left: <span class="value">${left}</span></div>
            <div style="margin-top: 0.5rem; border-top: 1px solid rgba(148, 163, 184, 0.2); padding-top: 0.5rem;">
              <div>Viewport: <span class="value">${vw}×${vh}</span></div>
            </div>
          `;
        };

        updateSafeAreaValues();
        window.addEventListener("resize", updateSafeAreaValues);
        window.addEventListener("orientationchange", updateSafeAreaValues);
      }

      // Create safe-area visual indicator
      let safeAreaDisplay = document.getElementById("qa-safe-area-display-root");
      if (!safeAreaDisplay) {
        safeAreaDisplay = document.createElement("div");
        safeAreaDisplay.id = "qa-safe-area-display-root";
        safeAreaDisplay.className = "qa-safe-area-display";
        document.body.appendChild(safeAreaDisplay);
      }
    } else {
      document.documentElement.removeAttribute("data-qa-debug");
      document.querySelectorAll(".tap-target").forEach((el) => {
        el.classList.remove("qa-tap-target");
      });
      const panel = document.getElementById("qa-safe-area-panel-root");
      if (panel) panel.remove();
      const display = document.getElementById("qa-safe-area-display-root");
      if (display) display.remove();
    }
  }, [qaDebugMode]);

  return (
    <>
      <Navbar darkMode={darkMode} onToggleTheme={() => setDarkMode((v) => !v)} />
      <main className="min-h-[calc(100vh-72px)] safe-main-padding md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="page-shell"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/hotels" element={<HotelsPage />} />
              <Route path="/hotels/:id" element={<HotelDetailsPage />} />
              <Route
                path="/checkout/:id"
                element={
                  <ProtectedRoute>
                    <BookingCheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/confirmation/:bookingId"
                element={
                  <ProtectedRoute>
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <BookingHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <PaymentHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      {!hideFooter ? <GlobalFooter /> : null}
      {!hideBottomNav ? <MobileBottomNav isLoggedIn={Boolean(user)} /> : null}
      {!hideAiChat ? <AiChatWidget /> : null}
      <Toaster position="bottom-right" />

      <AnimatePresence>
        {showSplash ? (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f96f38]"
          >
            <motion.div
              initial={{ scale: 0.82, opacity: 0.15 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="text-center"
            >
              <p className="font-display text-4xl font-extrabold tracking-tight text-white">Horizon-Hotels</p>
              <p className="mt-2 text-sm text-white/90">Smart stays. Smooth booking.</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
