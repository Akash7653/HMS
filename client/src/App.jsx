import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/ui/Navbar";
import GlobalFooter from "./components/ui/GlobalFooter";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import HomePage from "./pages/HomePage";
import HotelsPage from "./pages/HotelsPage";
import HotelDetailsPage from "./pages/HotelDetailsPage";
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
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <>
      <Navbar darkMode={darkMode} onToggleTheme={() => setDarkMode((v) => !v)} />
      <main className="min-h-[calc(100vh-72px)]">
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
      <AiChatWidget />
      <Toaster position="bottom-right" />
    </>
  );
}
