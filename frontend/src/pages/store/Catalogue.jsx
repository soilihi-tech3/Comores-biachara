import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import api, { SLUG } from "../../api";
import ProductCard from "../../components/ProductCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { subscribeRealtime } from "../../utils/realtime.js";

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useCart();
  const { invalidate, getData, setData, isStale } = useData();

  const categoryId = params.get("categoryId") || "";
  const famille = params.get("famille") || "";
  const search = params.get("search") || "";
  const onlyFavoris = params.get("favoris") === "1";

  const cacheKey = `products:${SLUG}:${categoryId}:${famille}:${search}`;

  const [categories, setCategories] = useState(() => {
    const cached = getData(`categories:${SLUG}`);
    if (cached && Array.isArray(cached)) return cached;
    try {
      const ls = localStorage.getItem(`cached_categories_${SLUG}`);
      return ls ? JSON.parse(ls) : [];
    } catch (e) { return []; }
  });

  const [products, setProducts] = useState(() => {
    const cached = getData(cacheKey);
    if (cached && Array.isArray(cached)) return cached;
    try {
      const ls = localStorage.getItem(`cached_products_${SLUG}`);
      return ls ? JSON.parse(ls) : [];
    } catch (e) { return []; }
  });

  const [loading, setLoading] = useState(() => {
    const cached = getData(cacheKey);
    return !cached && products.length === 0;
  });

  const [favIds, setFavIds] = useState([]);

  // Scroll to top on filter change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [categoryId, famille, search, onlyFavoris]);

  // User-scoped favorites sync
  useEffect(() => {
    function updateFavs() {
      const key = user && user.id ? `favorites_user_${user.id}` : "favorites_guest";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      setFavIds(list);
    }
    updateFavs();
    window.addEventListener("favorites_updated", updateFavs);
    return () => window.removeEventListener("favorites_updated", updateFavs);
  }, [user?.id]);

  function loadCategories(force = false) {
    const key = `categories:${SLUG}`;
    if (!force && !isStale(key)) {
      const cached = getData(key);
      if (cached) { setCategories(cached); return; }
    }
    api.get(`/store/${SLUG}/categories`).then((res) => {
      setData(key, res.data, 300000);
      setCategories(res.data);
    });
  }

  function loadProducts(force = false) {
    const cacheKey = `products:${SLUG}:${categoryId}:${famille}:${search}`;
    if (!force && !isStale(cacheKey)) {
      const cached = getData(cacheKey);
      if (cached) { setProducts(cached); setLoading(false); return; }
    }
    setLoading(true);
    const query = {};
    if (categoryId) query.categoryId = categoryId;
    if (famille) query.famille = famille;
    if (search) query.search = search;
    api.get(`/store/${SLUG}/products`, { params: query })
      .then((res) => {
        setData(cacheKey, res.data, 120000);
        setProducts(res.data);
        if (!categoryId && !famille && !search) {
          try { localStorage.setItem(`cached_products_${SLUG}`, JSON.stringify(res.data)); } catch (e) {}
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [categoryId, famille, search]);

  useEffect(() => {
    const unsub = subscribeRealtime((detail) => {
      if (detail.type === "product_updated") {
        invalidate("products");
        loadProducts(true);
      } else if (detail.type === "category_updated") {
        invalidate("categories");
        loadCategories(true);
      }
    });
    return unsub;
  }, [categoryId, famille, search, invalidate]);

  const stripAccents = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  let displayedProducts = products;
  if (onlyFavoris) {
    displayedProducts = displayedProducts.filter(p => favIds.includes(p.id));
  } else if (famille) {
    const fClean = stripAccents(famille);
    displayedProducts = displayedProducts.filter(p => {
      const pFam = stripAccents(p.Category?.famille || p.famille);
      const pCatNom = stripAccents(p.Category?.nom);
      const pNom = stripAccents(p.nom);
      return pFam.includes(fClean) || fClean.includes(pFam) || pCatNom.includes(fClean) || fClean.includes(pCatNom) || pNom.includes(fClean);
    });
  }

  function clearAllFavorites() {
    if (!window.confirm("Voulez-vous vraiment vider tous vos favoris ?")) return;
    const key = user && user.id ? `favorites_user_${user.id}` : "favorites_guest";
    localStorage.setItem(key, JSON.stringify([]));
    window.dispatchEvent(new Event("favorites_updated"));
    showToast("Tous vos favoris ont été supprimés.", "info", "Favoris");
  }

  return (
    <div style={{ minHeight: "65vh" }}>
      <div className="bs-cats">
        <div 
          className={"bs-cat-card" + (!categoryId && !famille && !onlyFavoris ? " on" : "")} 
          onClick={() => setParams({})}
        >
          <div className="bs-cat-name" style={{ padding: "20px 0" }}>Tout afficher</div>
        </div>

        <div 
          className={"bs-cat-card" + (onlyFavoris ? " on" : "")} 
          onClick={() => setParams({ favoris: "1" })}
          style={{ 
            borderColor: onlyFavoris ? "#B4483A" : undefined, 
            background: onlyFavoris ? "#FAD2CD" : undefined 
          }}
        >
          <div className="bs-cat-name" style={{ padding: "16px 0", color: onlyFavoris ? "#B4483A" : "var(--ink)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Heart size={16} fill={onlyFavoris ? "#B4483A" : "none"} color={onlyFavoris ? "#B4483A" : "var(--ink)"} /> Mes Favoris ({favIds.length})
          </div>
        </div>

        {categories.map((c) => (
          <div 
            key={c.id} 
            className={"bs-cat-card" + (categoryId == c.id && !onlyFavoris ? " on" : "")}
            onClick={() => setParams({ categoryId: c.id })}
          >
            <img 
              src={c.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80"} 
              alt={c.nom} 
              loading="lazy"
              decoding="async"
              className="bs-cat-img" 
            />
            <div className="bs-cat-name">{c.nom}</div>
          </div>
        ))}
      </div>

      <div className="bs-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2>
          {loading 
            ? "Chargement du catalogue..." 
            : onlyFavoris 
            ? `Mes produits favoris (${displayedProducts.length})` 
            : famille
            ? `Produits de la section "${famille}" (${displayedProducts.length})`
            : `${displayedProducts.length} produit(s) trouvé(s)`}
        </h2>

        {onlyFavoris && displayedProducts.length > 0 && (
          <button 
            onClick={clearAllFavorites}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#FDF2F0", color: "#B4483A", border: "1px solid #F8D7D2",
              padding: "8px 16px", borderRadius: 20, fontWeight: 700, fontSize: 13,
              cursor: "pointer", transition: "all 0.2s ease"
            }}
            title="Supprimer tous les favoris"
          >
            <Trash2 size={15} /> Supprimer tous les favoris
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, padding: "20px 0" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} style={{ background: "#fff", height: 280, borderRadius: 16, border: "1px solid var(--line)", animation: "pulse 1.2s infinite ease-in-out" }} />
          ))}
        </div>
      ) : (
        <>
          {onlyFavoris && displayedProducts.length === 0 && (
            <div style={{ padding: 60, textAlign: "center", color: "var(--muted)", background: "#fff", borderRadius: 16 }}>
              <Heart size={44} color="#B4483A" style={{ marginBottom: 12, opacity: 0.8 }} />
              <h3 style={{ margin: "0 0 8px", color: "var(--forest-dark)" }}>Aucun produit dans vos favoris</h3>
              <p style={{ margin: 0, fontSize: 14 }}>
                Parcourez le catalogue et cliquez sur l'icône cœur d'un produit pour l'ajouter à vos favoris personnels !
              </p>
            </div>
          )}

          {!onlyFavoris && displayedProducts.length === 0 && (
            <div style={{ padding: 60, textAlign: "center", color: "var(--muted)", background: "#fff", borderRadius: 16 }}>
              Aucun produit ne correspond à vos critères de recherche.
            </div>
          )}

          <div className="bs-grid">
            {displayedProducts.map((p) => <ProductCard key={p.id} product={p} isFavorisPage={onlyFavoris} />)}
          </div>
        </>
      )}
    </div>
  );
}

