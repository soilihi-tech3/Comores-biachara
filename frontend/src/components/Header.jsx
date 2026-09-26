import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Search, User, LogOut, Store, X, Home, Grid, Package, Shield, Menu, ChevronDown, Info, Heart, Sun, Moon, Smartphone } from "lucide-react";

import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api, { SLUG } from "../api";
import CartDrawer from "./CartDrawer.jsx";
import NotificationMenu from "./NotificationMenu.jsx";
import ProfileModal from "./ProfileModal.jsx";

const fcfa = (n) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";

export default function Header({ setCartOpen: setCartOpenProp }) {
  const { user, boutique: boutiqueContext, logout, theme, toggleTheme } = useAuth();
  const { count, showToast } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [boutiqueLocal, setBoutiqueLocal] = useState(null);
  const [categories, setCategories] = useState(() => {
    try {
      const ls = localStorage.getItem(`cached_categories_${SLUG}`);
      return ls ? JSON.parse(ls) : [];
    } catch (e) { return []; }
  });
  const [results, setResults] = useState([]);
  const [allProducts, setAllProducts] = useState(() => {
    try {
      const ls = localStorage.getItem(`cached_products_${SLUG}`);
      return ls ? JSON.parse(ls) : [];
    } catch (e) { return []; }
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const categoriesRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const boutique = boutiqueContext || boutiqueLocal;

  function openMobileSearch() {
    setMobileSearchOpen(true);
    setTimeout(() => {
      mobileSearchInputRef.current?.focus();
    }, 120);
  }

  function closeMobileSearch() {
    setMobileSearchOpen(false);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  useEffect(() => {
    if (!boutiqueContext) {
      api.get(`/store/${SLUG}`).then((res) => setBoutiqueLocal(res.data)).catch(() => { });
    }
    api.get(`/store/${SLUG}/products`).then((res) => {
      if (Array.isArray(res.data)) {
        setAllProducts(res.data);
        try { localStorage.setItem(`cached_products_${SLUG}`, JSON.stringify(res.data)); } catch (e) {}
      }
    }).catch(() => { });

    api.get(`/store/${SLUG}/categories`).then((res) => {
      if (Array.isArray(res.data)) {
        setCategories(res.data);
        try { localStorage.setItem(`cached_categories_${SLUG}`, JSON.stringify(res.data)); } catch (e) {}
      }
    }).catch(() => { });
  }, [boutiqueContext]);

  // Live search filtering
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const filtered = allProducts
      .filter(p => p.nom?.toLowerCase().includes(q))
      .slice(0, 6);
    setResults(filtered);
    setShowDropdown(true);
  }, [query, allProducts]);

  // Click outside listener
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function onSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      navigate(`/catalogue?search=${encodeURIComponent(query.trim())}`);
    }
  }

  function goToProduct(id) {
    setShowDropdown(false);
    setQuery("");
    navigate(`/produit/${id}`);
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  return (
    <>
      <header style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, zIndex: 1000, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        {/* ROW 1: MAIN HEADER ROW */}
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>

          {/* LOGO (FAR LEFT) */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            {boutique?.logoUrl ? (
              <img src={boutique.logoUrl} alt={boutique.nom} style={{ height: 38, borderRadius: 10, objectFit: "contain" }} />
            ) : (
              <Store size={26} color="var(--forest)" />
            )}
            <span style={{ fontSize: 19, fontWeight: 900, color: "var(--forest-dark)", letterSpacing: "-0.5px" }}>
              {boutique?.nom || ""}
            </span>
          </Link>

          {/* MAIN NAV LINKS (DESKTOP ONLY > 992px) */}
          <nav className="bs-desktop-nav">
            <Link
              to="/"
              style={{
                fontSize: 14.5, fontWeight: 700, color: location.pathname === "/" ? "var(--forest)" : "var(--ink)",
                textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s ease"
              }}
            >
              <Home size={16} /> Accueil
            </Link>

            <Link
              to="/a-propos"
              style={{
                fontSize: 14.5, fontWeight: 700, color: location.pathname === "/a-propos" ? "var(--forest)" : "var(--ink)",
                textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s ease"
              }}
            >
              <Info size={16} /> À propos
            </Link>

            <Link
              to="/recharge-mobile"
              style={{
                fontSize: 14.5, fontWeight: 700, color: location.pathname === "/recharge-mobile" ? "var(--forest)" : "var(--ink)",
                textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s ease"
              }}
            >
              <Smartphone size={16} /> Recharge Crédit
            </Link>

            <Link
              to="/catalogue"
              style={{
                fontSize: 14.5, fontWeight: 700, color: location.pathname === "/catalogue" && !location.search.includes("favoris=1") ? "var(--forest)" : "var(--ink)",
                textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s ease"
              }}
            >
              <Grid size={16} /> Catalogue
            </Link>

            <Link
              to="/catalogue?favoris=1"
              style={{
                fontSize: 14.5, fontWeight: 700, color: location.search.includes("favoris=1") ? "#B4483A" : "var(--ink)",
                textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s ease"
              }}
            >
              <Heart size={16} color="#B4483A" fill={location.search.includes("favoris=1") ? "#B4483A" : "none"} /> Favoris
            </Link>

            {user?.role === "client" && (
              <Link
                to="/mes-commandes"
                style={{
                  fontSize: 14.5, fontWeight: 700, color: location.pathname === "/mes-commandes" ? "var(--forest)" : "var(--ink)",
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s ease"
                }}
              >
                <Package size={16} /> Mes commandes
              </Link>
            )}
          </nav>

          {/* MOBILE SEARCH TRIGGER BUTTON (TOUCH RECHERCHE MOBILE) */}
          <button
            type="button"
            className="bs-mobile-search-trigger"
            onClick={openMobileSearch}
            title="Rechercher un produit"
          >
            <Search size={18} color="var(--forest-dark)" />
          </button>

          {/* VISIBLE & PROMINENT SEARCH INPUT (DESKTOP) */}
          <div ref={searchRef} className="bs-header-search" style={{ flex: "0 1 320px", position: "relative" }}>
            <form onSubmit={onSearch} style={{
              display: "flex", alignItems: "center", background: "var(--paper)",
              border: "1.5px solid var(--line)", borderRadius: 24, padding: "8px 16px",
              transition: "border-color 0.2s"
            }}>
              <Search size={16} color="var(--forest)" style={{ marginRight: 8, flexShrink: 0 }} />
              <input
                placeholder="Rechercher un produit, fruit..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                autoComplete="off"
                style={{
                  border: "none", background: "transparent", outline: "none",
                  width: "100%", fontSize: 13.5, color: "var(--ink)", fontWeight: 500
                }}
              />
              {query && (
                <button type="button" onClick={clearSearch} style={{
                  background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
                  display: "flex", alignItems: "center", padding: 0, marginLeft: 4
                }}>
                  <X size={15} />
                </button>
              )}
            </form>

            {/* LIVE SEARCH DROPDOWN */}
            {showDropdown && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                background: "#fff", borderRadius: 14, border: "1px solid var(--line)",
                boxShadow: "0 8px 32px rgba(34,75,53,0.15)", zIndex: 3000, overflow: "hidden"
              }}>
                {results.length === 0 ? (
                  <div style={{ padding: "16px 18px", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
                    Aucun produit trouvé pour « {query} »
                  </div>
                ) : (
                  <>
                    {results.map(p => (
                      <div key={p.id} onClick={() => goToProduct(p.id)} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                        cursor: "pointer", borderBottom: "1px solid var(--line)", transition: "background 0.15s"
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--paper)"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        <img
                          src={p.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=60&q=80"}
                          alt={p.nom}
                          style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid var(--line)" }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.nom}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{p.Category?.nom}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--forest-dark)", flexShrink: 0 }}>
                          {fcfa(p.prixPromo || p.prix)}
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={() => { setShowDropdown(false); navigate(`/catalogue?search=${encodeURIComponent(query.trim())}`); }}
                      style={{ padding: "10px 14px", textAlign: "center", fontSize: 13, color: "var(--forest)", fontWeight: 700, cursor: "pointer", background: "var(--forest-light)" }}
                    >
                      Voir tous les résultats pour « {query} »
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ACTIONS (CONNEXION & PANIER PINNED FAR RIGHT) */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexShrink: 0, marginLeft: "auto" }}>
            {user ? (
              <>
                <NotificationMenu />

                <div ref={userMenuRef} className="bs-desktop-user-menu" style={{ position: "relative" }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "4px 8px", borderRadius: "30px", transition: "background 0.2s"
                    }}
                    title="Menu profil"
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "var(--forest)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 14, boxShadow: "0 2px 8px rgba(34,75,53,0.2)"
                    }}>
                      {user.nom ? user.nom.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.nom?.split(" ")[0]}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div style={{
                      position: "absolute", right: 0, top: "calc(100% + 8px)",
                      width: 220, background: "#fff", borderRadius: 14,
                      border: "1px solid var(--line)", boxShadow: "0 8px 32px rgba(22,52,36,0.15)",
                      zIndex: 3000, overflow: "hidden"
                    }}>
                      <div style={{ padding: "14px 16px", background: "var(--paper)", borderBottom: "1px solid var(--line)" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--forest-dark)" }}>{user.nom}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)", textTransform: "capitalize" }}>
                          {user.role === "client" ? "Client" : user.role === "employe" ? "Employé" : "Administrateur"}
                        </div>
                      </div>

                      <div style={{ padding: "6px 0" }}>
                        <button
                          onClick={() => { setUserMenuOpen(false); navigate("/profil"); }}
                          style={{
                            width: "100%", padding: "10px 16px", background: "none", border: "none",
                            textAlign: "left", cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: "var(--ink)", display: "flex", alignItems: "center", gap: 10
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <User size={16} color="var(--forest)" /> Mon Profil
                        </button>

                        {user.role === "client" && (
                          <button
                            onClick={() => { setUserMenuOpen(false); navigate("/mes-commandes"); }}
                            style={{
                              width: "100%", padding: "10px 16px", background: "none", border: "none",
                              textAlign: "left", cursor: "pointer", fontSize: 13, fontWeight: 600,
                              color: "var(--ink)", display: "flex", alignItems: "center", gap: 10
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            <Package size={16} color="var(--forest)" /> Mes Commandes
                          </button>
                        )}

                        {(user.role === "admin" || user.role === "employe" || user.role === "super_admin") && (
                          <button
                            onClick={() => { setUserMenuOpen(false); navigate("/admin"); }}
                            style={{
                              width: "100%", padding: "10px 16px", background: "none", border: "none",
                              textAlign: "left", cursor: "pointer", fontSize: 13, fontWeight: 600,
                              color: "var(--ink)", display: "flex", alignItems: "center", gap: 10
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            <Shield size={16} color="var(--forest)" /> Tableau de bord
                          </button>
                        )}

                        <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "4px 0" }} />

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                            showToast("Déconnexion réussie. À bientôt !", "info", "Déconnexion");
                          }}
                          style={{
                            width: "100%", padding: "10px 16px", background: "none", border: "none",
                            textAlign: "left", cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: "#B4483A", display: "flex", alignItems: "center", gap: 10
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#FDF2F0")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <LogOut size={16} /> Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bs-desktop-auth-btn">
                <Link to="/connexion" style={{ textDecoration: "none" }}>
                  <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: 13.5, color: "var(--muted)" }}>
                    <User size={16} /> <span>Connexion</span>
                  </button>
                </Link>
              </div>
            )}

            {/* BOUTON CHANGER LE THÈME */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: "50%",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--forest-dark)",
                transition: "all 0.2s ease"
              }}
            >
              {theme === "dark" ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="var(--forest-dark)" />}
            </button>

            <button className="bs-cart-btn" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={16} />
              <span>Panier</span>
              {count > 0 && <span className="bs-badge">{count}</span>}
            </button>
          </div>
        </div>

        {/* ROW 2: SECONDARY CATEGORIES BAR & GALLERY */}
        <div style={{ background: "var(--paper)", borderTop: "1px solid var(--line)", padding: "8px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>

            {/* DROPDOWN BUTTON FOR ALL CATEGORIES */}
            <div ref={categoriesRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                style={{
                  background: "var(--forest)", color: "#fff",
                  border: "none", borderRadius: 20, padding: "8px 18px",
                  fontWeight: 800, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}
              >
                <Menu size={16} /> Toutes les catégories <ChevronDown size={14} />
              </button>

              {categoriesOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0,
                  width: 250, background: "var(--card)", borderRadius: 14,
                  border: "1px solid var(--line)", boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                  zIndex: 3000, overflow: "hidden", padding: "6px 0"
                }}>
                  {categories.length === 0 ? (
                    <div style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--muted)" }}>Aucune catégorie</div>
                  ) : (
                    categories.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setCategoriesOpen(false);
                          navigate(`/catalogue?categoryId=${cat.id}`);
                        }}
                        style={{
                          padding: "10px 16px", fontSize: 13, fontWeight: 600,
                          color: "var(--ink)", cursor: "pointer", display: "flex",
                          alignItems: "center", gap: 10, transition: "background 0.15s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.nom} style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <Grid size={16} color="var(--forest)" />
                        )}
                        <span>{cat.nom}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* HORIZONTAL GALLERY / PILL LIST OF CATEGORIES */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", padding: "4px 0" }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/catalogue?categoryId=${cat.id}`)}
                  style={{
                    background: "var(--card)", border: "1px solid var(--line)",
                    borderRadius: 20, padding: "5px 14px", fontSize: 12.5,
                    fontWeight: 600, color: "var(--ink)", cursor: "pointer",
                    whiteSpace: "nowrap", display: "inline-flex", alignItems: "center",
                    gap: 6, transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--forest-light)"; e.currentTarget.style.borderColor = "var(--forest)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.borderColor = "var(--line)"; }}
                >
                  {cat.imageUrl && (
                    <img src={cat.imageUrl} alt={cat.nom} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                  )}
                  <span>{cat.nom}</span>
                </button>
              ))}
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="bs-mobile-bottom-bar">
        <Link to="/" className={`bs-mobile-nav-item ${location.pathname === "/" ? "active" : ""}`}>
          <Home size={19} />
          <span>Accueil</span>
        </Link>
        <Link to="/recharge-mobile" className={`bs-mobile-nav-item ${location.pathname === "/recharge-mobile" ? "active" : ""}`}>
          <Smartphone size={19} />
          <span>Recharge</span>
        </Link>
        <Link to="/catalogue" className={`bs-mobile-nav-item ${location.pathname === "/catalogue" && !location.search.includes("favoris=1") ? "active" : ""}`}>
          <Grid size={19} />
          <span>Catalogue</span>
        </Link>
        <Link to="/a-propos" className={`bs-mobile-nav-item ${location.pathname === "/a-propos" ? "active" : ""}`}>
          <Info size={19} />
          <span>À propos</span>
        </Link>
        <Link to="/catalogue?favoris=1" className={`bs-mobile-nav-item ${location.search.includes("favoris=1") ? "active" : ""}`}>
          <Heart size={19} color="#B4483A" fill={location.search.includes("favoris=1") ? "#B4483A" : "none"} />
          <span>Favoris</span>
        </Link>
        {user?.role === "client" && (
          <Link to="/mes-commandes" className={`bs-mobile-nav-item ${location.pathname === "/mes-commandes" ? "active" : ""}`}>
            <Package size={19} />
            <span>Commandes</span>
          </Link>
        )}
        <button className="bs-mobile-nav-item" onClick={() => setCartOpen(true)}>
          <div style={{ position: "relative", display: "flex" }}>
            <ShoppingCart size={19} />
            {count > 0 && <span className="bs-mobile-badge">{count}</span>}
          </div>
          <span>Panier</span>
        </button>
        {user ? (
          <Link to="/profil" className={`bs-mobile-nav-item ${location.pathname === "/profil" ? "active" : ""}`}>
            <User size={19} />
            <span>Profil</span>
          </Link>
        ) : (
          <Link to="/connexion" className={`bs-mobile-nav-item ${location.pathname === "/connexion" ? "active" : ""}`}>
            <User size={19} />
            <span>Connexion</span>
          </Link>
        )}
      </div>

      {/* MOBILE SEARCH OVERLAY WITH SEMI-TRANSPARENT BACKDROP */}
      {mobileSearchOpen && (
        <div
          className="bs-mobile-search-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("bs-mobile-search-overlay")) {
              closeMobileSearch();
            }
          }}
        >
          <form onSubmit={onSearch} className="bs-mobile-search-form" onClick={(e) => e.stopPropagation()}>
            <div className="bs-mobile-search-pill">
              <Search size={18} color="var(--forest)" style={{ flexShrink: 0 }} />
              <input
                ref={mobileSearchInputRef}
                placeholder="Rechercher un produit, fruit..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                className="bs-mobile-search-input"
              />
              {query ? (
                <button type="button" onClick={clearSearch} className="bs-mobile-search-clear">
                  <X size={18} />
                </button>
              ) : null}
            </div>
            <button type="button" onClick={closeMobileSearch} className="bs-mobile-search-close">
              Annuler
            </button>
          </form>

          {/* LIVE RESULTS IN MOBILE SEARCH OVERLAY */}
          {query.trim() && (
            <div className="bs-mobile-search-results" onClick={(e) => e.stopPropagation()}>
              {results.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: 13.5, fontWeight: 600 }}>
                  Aucun produit trouvé pour « {query} »
                </div>
              ) : (
                <>
                  {results.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { closeMobileSearch(); goToProduct(p.id); }}
                      className="bs-mobile-search-item"
                    >
                      <img src={p.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=60&q=80"} alt={p.nom} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="nom">{p.nom}</div>
                        <div className="cat">{p.Category?.nom}</div>
                      </div>
                      <div className="prix">{fcfa(p.prixPromo || p.prix)}</div>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      closeMobileSearch();
                      navigate(`/catalogue?search=${encodeURIComponent(query.trim())}`);
                    }}
                    className="bs-mobile-search-see-all"
                  >
                    Voir tous les résultats pour « {query} »
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
}
