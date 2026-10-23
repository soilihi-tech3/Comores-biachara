import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Heart, Trash2, Loader2, ArrowDown } from "lucide-react";
import api, { SLUG } from "../../api";
import ProductCard from "../../components/ProductCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { subscribeRealtime } from "../../utils/realtime.js";
import { Skel } from "../../components/Skeleton.jsx";

const PAGE_SIZE = 20;

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useCart();
  const { invalidate, getData, setData, isStale } = useData();

  const categoryId = params.get("categoryId") || "";
  const famille = params.get("famille") || "";
  const search = params.get("search") || "";
  const onlyFavoris = params.get("favoris") === "1";

  const cacheKeyBase = `products:${SLUG}:${categoryId}:${famille}:${search}`;

  const [categories, setCategories] = useState(() => {
    const cached = getData(`categories:${SLUG}`);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    try {
      const ls = localStorage.getItem(`cached_categories_${SLUG}`);
      return ls ? JSON.parse(ls) : [];
    } catch (e) { return []; }
  });

  const [products, setProducts] = useState(() => {
    const cached = getData(`${cacheKeyBase}:p1`);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    try {
      const ls = localStorage.getItem(`cached_products_${SLUG}_p1`);
      return ls ? JSON.parse(ls) : [];
    } catch (e) { return []; }
  });

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(() => {
    const hasProd = products && products.length > 0;
    return !hasProd;
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [favIds, setFavIds] = useState([]);

  const sentinelRef = useRef(null);

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
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setCategories(cached);
        return;
      }
    }
    api.get(`/store/${SLUG}/categories`).then((res) => {
      setData(key, res.data, 300000);
      setCategories(res.data);
      try { localStorage.setItem(`cached_categories_${SLUG}`, JSON.stringify(res.data)); } catch(e) {}
    }).catch(() => {});
  }

  // Load first page (20 products)
  const loadFirstPage = useCallback((force = false) => {
    const cacheKey = `${cacheKeyBase}:p1`;
    if (!force && !isStale(cacheKey)) {
      const cached = getData(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setProducts(cached);
        setPage(1);
        setLoading(false);
        return;
      }
    }

    if (products.length === 0) {
      setLoading(true);
    }

    const query = {
      page: 1,
      limit: PAGE_SIZE,
      paginate: "true"
    };
    if (categoryId) query.categoryId = categoryId;
    if (famille) query.famille = famille;
    if (search) query.search = search;

    api.get(`/store/${SLUG}/products`, { params: query })
      .then((res) => {
        let items = [];
        let more = false;
        let total = 0;

        if (res.data && Array.isArray(res.data.products)) {
          items = res.data.products;
          more = !!res.data.hasMore;
          total = res.data.total || items.length;
        } else if (Array.isArray(res.data)) {
          items = res.data;
          more = items.length >= PAGE_SIZE;
          total = items.length;
        }

        setData(cacheKey, items, 180000);
        setProducts(items);
        setPage(1);
        setHasMore(more);
        setTotalCount(total);

        if (!categoryId && !famille && !search) {
          try { localStorage.setItem(`cached_products_${SLUG}_p1`, JSON.stringify(items)); } catch(e) {}
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [cacheKeyBase, categoryId, famille, search, getData, isStale, setData, products.length]);

  // Load next page of 20 products on scroll
  const loadNextPage = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    const query = {
      page: nextPage,
      limit: PAGE_SIZE,
      paginate: "true"
    };
    if (categoryId) query.categoryId = categoryId;
    if (famille) query.famille = famille;
    if (search) query.search = search;

    api.get(`/store/${SLUG}/products`, { params: query })
      .then((res) => {
        let newItems = [];
        let more = false;

        if (res.data && Array.isArray(res.data.products)) {
          newItems = res.data.products;
          more = !!res.data.hasMore;
        } else if (Array.isArray(res.data)) {
          newItems = res.data;
          more = newItems.length >= PAGE_SIZE;
        }

        setProducts((prev) => {
          // Filtrer les doublons éventuels par ID
          const existingIds = new Set(prev.map((p) => p.id));
          const filteredNew = newItems.filter((p) => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });

        setPage(nextPage);
        setHasMore(more);
        setLoadingMore(false);
      })
      .catch(() => {
        setLoadingMore(false);
      });
  }, [loading, loadingMore, hasMore, page, categoryId, famille, search]);

  useEffect(() => {
    loadCategories(false);
  }, []);

  // Reload page 1 when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadFirstPage(false);
  }, [categoryId, famille, search]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (onlyFavoris || !hasMore || loading) return;

    const currentSentinel = sentinelRef.current;
    if (!currentSentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          loadNextPage();
        }
      },
      {
        root: null,
        rootMargin: "300px", // Précharge 300px avant le bas de l'écran pour une fluidité absolue
        threshold: 0.1
      }
    );

    observer.observe(currentSentinel);
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [onlyFavoris, hasMore, loading, loadingMore, loadNextPage]);

  // Realtime updates
  useEffect(() => {
    const unsub = subscribeRealtime((detail) => {
      if (detail.type === "product_updated") {
        invalidate("products");
        loadFirstPage(true);
      } else if (detail.type === "category_updated") {
        invalidate("categories");
        loadCategories(true);
      }
    });
    return unsub;
  }, [categoryId, famille, search, invalidate, loadFirstPage]);

  const stripAccents = (str) =>
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  let displayedProducts = products;
  if (onlyFavoris) {
    displayedProducts = displayedProducts.filter((p) => favIds.includes(p.id));
  } else if (famille) {
    const fClean = stripAccents(famille);
    displayedProducts = displayedProducts.filter((p) => {
      const pFam = stripAccents(p.Category?.famille || p.famille);
      const pCatNom = stripAccents(p.Category?.nom);
      const pNom = stripAccents(p.nom);
      return (
        pFam.includes(fClean) ||
        fClean.includes(pFam) ||
        pCatNom.includes(fClean) ||
        fClean.includes(pCatNom) ||
        pNom.includes(fClean)
      );
    });
  }

  function clearAllFavorites() {
    if (!window.confirm("Voulez-vous vraiment vider tous vos favoris ?")) return;
    const key = user && user.id ? `favorites_user_${user.id}` : "favorites_guest";
    localStorage.setItem(key, JSON.stringify([]));
    window.dispatchEvent(new Event("favorites_updated"));
    showToast("Tous vos favoris ont été supprimés.", "info", "Favoris");
  }

  // Skeleton Card
  const SkeletonCard = ({ delay = 0 }) => (
    <div className="bs-skeleton-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="bs-skeleton-img" />
      <div className="bs-skeleton-body">
        <div className="bs-skeleton-line bs-skeleton-title" />
        <div className="bs-skeleton-line bs-skeleton-sub" />
        <div className="bs-skeleton-line bs-skeleton-price" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "65vh" }}>
      {/* Categories strip */}
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
            background: onlyFavoris ? "#FAD2CD" : undefined,
          }}
        >
          <div
            className="bs-cat-name"
            style={{
              padding: "16px 0",
              color: onlyFavoris ? "#B4483A" : "var(--ink)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Heart
              size={16}
              fill={onlyFavoris ? "#B4483A" : "none"}
              color={onlyFavoris ? "#B4483A" : "var(--ink)"}
            />{" "}
            Mes Favoris ({favIds.length})
          </div>
        </div>

        {categories.map((c) => (
          <div
            key={c.id}
            className={"bs-cat-card" + (categoryId == c.id && !onlyFavoris ? " on" : "")}
            onClick={() => setParams({ categoryId: c.id })}
          >
            <img
              src={
                c.imageUrl ||
                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80"
              }
              alt={c.nom}
              loading="lazy"
              decoding="async"
              className="bs-cat-img"
            />
            <div className="bs-cat-name">{c.nom}</div>
          </div>
        ))}
      </div>

      {/* Section header */}
      <div
        className="bs-section-title"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        {loading ? (
          <Skel w={240} h={22} />
        ) : (
          <h2>
            {onlyFavoris
              ? `Mes produits favoris (${displayedProducts.length})`
              : famille
              ? `Produits de la section "${famille}" (${displayedProducts.length}${totalCount > displayedProducts.length ? ` sur ${totalCount}` : ""})`
              : `${displayedProducts.length}${totalCount > displayedProducts.length ? ` sur ${totalCount}` : ""} produit(s) affiché(s)`}
          </h2>
        )}

        {onlyFavoris && displayedProducts.length > 0 && (
          <button
            onClick={clearAllFavorites}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#FDF2F0",
              color: "#B4483A",
              border: "1px solid #F8D7D2",
              padding: "8px 16px",
              borderRadius: 20,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title="Supprimer tous les favoris"
          >
            <Trash2 size={15} /> Supprimer tous les favoris
          </button>
        )}
      </div>

      {loading ? (
        /* SKELETON LOADER PREMIER CHARGEMENT (20 CARTES) */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
            padding: "4px 0 20px",
          }}
        >
          {[0, 60, 120, 180, 240, 300, 360, 420].map((delay, i) => (
            <SkeletonCard key={i} delay={delay} />
          ))}
        </div>
      ) : (
        /* GRILLE DE PRODUITS */
        <div style={{ animation: "catalogueReveal 0.3s ease" }}>
          {onlyFavoris && displayedProducts.length === 0 && (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "var(--muted)",
                background: "#fff",
                borderRadius: 16,
              }}
            >
              <Heart size={44} color="#B4483A" style={{ marginBottom: 12, opacity: 0.8 }} />
              <h3 style={{ margin: "0 0 8px", color: "var(--forest-dark)" }}>
                Aucun produit dans vos favoris
              </h3>
              <p style={{ margin: 0, fontSize: 14 }}>
                Parcourez le catalogue et cliquez sur l'icône cœur d'un produit pour
                l'ajouter à vos favoris personnels !
              </p>
            </div>
          )}

          {!onlyFavoris && displayedProducts.length === 0 && (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "var(--muted)",
                background: "#fff",
                borderRadius: 16,
              }}
            >
              Aucun produit ne correspond à vos critères de recherche.
            </div>
          )}

          <div className="bs-grid">
            {displayedProducts.map((p) => (
              <ProductCard key={p.id} product={p} isFavorisPage={onlyFavoris} />
            ))}
          </div>

          {/* Sentinel pour détection automatique du scroll infini */}
          {!onlyFavoris && hasMore && (
            <div ref={sentinelRef} style={{ height: 20, margin: "20px 0" }} />
          )}

          {/* Indicateur de chargement au scroll ou bouton manuel */}
          {!onlyFavoris && hasMore && (
            <div style={{ textAlign: "center", padding: "24px 0 40px" }}>
              {loadingMore ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(18, 53, 36, 0.06)",
                    color: "var(--forest-dark)",
                    padding: "10px 22px",
                    borderRadius: 30,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  <Loader2 size={18} className="bs-spin" /> Chargement des 20 prochains produits...
                </div>
              ) : (
                <button
                  onClick={loadNextPage}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--forest-dark)",
                    color: "#fff",
                    border: "none",
                    padding: "12px 28px",
                    borderRadius: 30,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(18, 53, 36, 0.15)",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <ArrowDown size={16} /> Charger plus de produits (20 de plus)
                </button>
              )}
            </div>
          )}

          {/* Fin du catalogue */}
          {!onlyFavoris && !hasMore && displayedProducts.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 0 20px",
                color: "var(--muted)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ✓ Vous avez vu tous les {displayedProducts.length} produits du catalogue.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
