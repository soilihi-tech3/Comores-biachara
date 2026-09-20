import React, { createContext, useContext, useEffect, useState } from "react";
import api, { SLUG } from "../api";

const BoutiqueContext = createContext(null);

export function BoutiqueProvider({ children }) {
  const [boutique, setBoutique] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_boutique");
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshBoutique = async () => {
    setLoading(true);
    setError(null);
    const timestamp = Date.now();

    try {
      // 1. Appeler l'API de résolution automatique du sous-domaine / header
      const res = await api.get(`/boutique/current?t=${timestamp}`);
      if (res.data) {
        setBoutique(res.data);
        try { localStorage.setItem("cached_boutique", JSON.stringify(res.data)); } catch (e) {}
        // Mettre à jour le titre HTML du document dynamiquement avec le nom de la boutique
        if (res.data.nom) {
          document.title = `${res.data.nom} | E-commerce & Vente Directe`;
        }
      } else {
        setError("Boutique introuvable.");
      }
    } catch (err) {
      // 2. Fallback via le slug du store si la route relative échoue
      try {
        const fallbackRes = await api.get(`/store/${SLUG}?t=${timestamp}`);
        if (fallbackRes.data) {
          setBoutique(fallbackRes.data);
          try { localStorage.setItem("cached_boutique", JSON.stringify(fallbackRes.data)); } catch (e) {}
          if (fallbackRes.data.nom) {
            document.title = `${fallbackRes.data.nom} | E-commerce & Vente Directe`;
          }
        } else {
          setError("Boutique introuvable.");
        }
      } catch (e) {
        setError("Cette boutique est introuvable ou indisponible.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBoutique();
  }, []);

  return (
    <BoutiqueContext.Provider value={{ boutique, setBoutique, loading, error, refreshBoutique }}>
      {children}
    </BoutiqueContext.Provider>
  );
}

export const useBoutique = () => {
  const ctx = useContext(BoutiqueContext);
  if (!ctx) {
    throw new Error("useBoutique must be used within a BoutiqueProvider");
  }
  return ctx;
};
