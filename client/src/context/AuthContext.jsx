import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hms_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("hms_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshMe = async () => {
    const res = await api.get("/auth/me");
    setUser(res.data.user);
    return res.data.user;
  };

  const login = async (payload) => {
    const res = await api.post("/auth/login", payload);
    localStorage.setItem("hms_token", res.data.token);
    setUser(res.data.user);
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    return res.data;
  };

  const verifyContact = async (payload) => {
    const res = await api.post("/auth/verify-contact", payload);
    localStorage.setItem("hms_token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const resendOtp = async (payload) => {
    const res = await api.post("/auth/resend-otp", payload);
    return res.data;
  };

  const updateProfile = async (payload) => {
    const res = await api.patch("/auth/profile", payload);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("hms_token");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, verifyContact, resendOtp, refreshMe, updateProfile, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
