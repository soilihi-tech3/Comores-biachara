import React, { createContext, useContext, useEffect, useState } from "react";
import api, { SLUG } from "../api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [boutique, setBoutique] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_boutique");
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const refreshBoutique = () => {
    const timestamp = Date.now();
    api.get(`/admin/boutique?t=${timestamp}`)
      .then((res) => {
        if (res.data) {
          setBoutique(res.data);
          try { localStorage.setItem("cached_boutique", JSON.stringify(res.data)); } catch (e) {}
        }
      })
      .catch(() => {
        api.get(`/store/${SLUG}?t=${timestamp}`).then((res) => {
          if (res.data) {
            setBoutique(res.data);
            try { localStorage.setItem("cached_boutique", JSON.stringify(res.data)); } catch (e) {}
          }
        }).catch(() => {});
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    refreshBoutique();
    if (!token) { 
      setLoading(false); 
      return; 
    }
    api.get("/auth/me").then((res) => {
      setUser(res.data.user);
    })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(identifiant, motDePasse) {
    const res = await api.post("/auth/login", { identifiant, email: identifiant, telephone: identifiant, motDePasse });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    refreshBoutique();
    return res.data.user;
  }

  async function register(nom, email, telephone, motDePasse) {
    const res = await api.post("/auth/register", { nom, email, telephone, motDePasse });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    refreshBoutique();
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, boutique, refreshBoutique, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


