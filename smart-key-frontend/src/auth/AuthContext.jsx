import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("TOKEN") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!token;

  const fetchProfile = async () => {
    const res = await api.get("/auth/profile");
    // your backend returns {success:true,data:{...}}
    setUser(res.data.data);
  };

const register = async ({ name, email, mobile, password, role_id }) => {
  const res = await api.post("/auth/register", { name, email, mobile, password, role_id });
  return res.data;
};


  const login = async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    const t = res.data.token;
    localStorage.setItem("TOKEN", t);
    setToken(t);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("TOKEN");
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    (async () => {
      try {
        if (token) await fetchProfile();
      } catch (e) {
        logout();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const value = useMemo(
  () => ({ token, user, isAuthed, loading, login, logout, fetchProfile, register }),
  [token, user, isAuthed, loading]
);


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
