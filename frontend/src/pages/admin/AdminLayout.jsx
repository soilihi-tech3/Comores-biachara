import React, { useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Store, LogOut, Layers, 
  PanelLeftClose, PanelLeftOpen, User, Image, LayoutGrid, CreditCard, 
  ShoppingBag, Truck, Scale, History, Menu, X, ExternalLink, ArrowLeft
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import NotificationMenu from "../../components/NotificationMenu.jsx";
import ProfileModal from "../../components/ProfileModal.jsx";

export default function AdminLayout() {
  const { user, boutique, logout } = useAuth();
  const { showToast } = useCart();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const perms = Array.isArray(user?.permissions) ? user.permissions : [];
  const storeName = boutique?.nom || "Marché Vert";

  const allLinks = [
    { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true, permKey: "voir_dashboard" },
    { to: "/admin/vente", label: "Vente Directe (POS)", icon: CreditCard, permKey: ["gerer_commandes", "voir_dashboard"] },
    { to: "/admin/ventes-historique", label: "Historique Ventes", icon: History, permKey: ["gerer_commandes", "voir_dashboard"] },
    { to: "/admin/achats", label: "Achats & Stocks", icon: ShoppingBag, permKey: ["gerer_produits", "gerer_parametres"] },
    { to: "/admin/fournisseurs", label: "Fournisseurs", icon: Truck, permKey: ["gerer_produits", "gerer_parametres"] },
    { to: "/admin/unites", label: "Unités de vente", icon: Scale, permKey: ["gerer_produits", "gerer_categories"] },
    { to: "/admin/home-banners", label: "Home Banners", icon: Image, permKey: ["gerer_banners", "gerer_parametres"] },
    { to: "/admin/side-banners", label: "Home Side Banners", icon: LayoutGrid, permKey: ["gerer_banners", "gerer_parametres"] },
    { to: "/admin/categories", label: "Catégories", icon: Layers, permKey: "gerer_categories" },
    { to: "/admin/produits", label: "Produits", icon: Package, permKey: ["ajouter_produit", "modifier_produit", "supprimer_produit", "gerer_produits"] },
    { to: "/admin/commandes", label: "Commandes", icon: ShoppingCart, permKey: ["valider_commande", "changer_statut_commande", "assigner_commande", "gerer_commandes"] },
    { to: "/admin/employes", label: "Utilisateurs", icon: Users, adminOnly: true },
    { to: "/admin/parametres", label: "Paramètres Boutique", icon: Store, permKey: "gerer_parametres" },
  ];

  const links = allLinks.filter(item => {
    if (user?.role === "admin" || user?.role === "super_admin") return true;
    if (item.adminOnly) return false;
    if (!item.permKey) return true;
    if (Array.isArray(item.permKey)) {
      return item.permKey.some(pk => perms.includes(pk));
    }
    return perms.includes(item.permKey);
  });

  return (
    <div className={`bs-admin ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* MOBILE BAR TOP */}
      <div className="bs-admin-mobile-header">
        <button 
          className="bs-hamburger-btn" 
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="bs-admin-mobile-brand">{storeName}</div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            to="/"
            title="Retour au site public"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--forest-dark)",
              background: "var(--paper)",
              padding: "5px 10px",
              borderRadius: 14,
              border: "1px solid var(--line)",
              textDecoration: "none"
            }}
          >
            <ArrowLeft size={14} /> Site
          </Link>
          <NotificationMenu />
        </div>
      </div>

      {/* OVERLAY BACKDROP FOR MOBILE */}
      {mobileOpen && (
        <div className="bs-sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`bs-sidebar ${mobileOpen ? "open" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", marginBottom: 20 }}>
          <div className="brand bs-side-label" style={{ margin: 0, padding: 0, border: "none", fontSize: 18 }}>{storeName}</div>
          
          {/* Collapse button on desktop */}
          <button 
            className="bs-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Afficher le menu" : "Masquer le menu"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Close button on mobile */}
          <button 
            className="bs-mobile-close-btn"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* DIRECT RETURN TO SITE LINK IN SIDEBAR */}
        <Link 
          to="/" 
          className="bs-side-btn"
          title="Retourner sur le site e-commerce"
          style={{ 
            background: "rgba(22, 52, 36, 0.07)", 
            color: "var(--forest-dark)", 
            fontWeight: 700, 
            marginBottom: 14,
            borderRadius: 10,
            border: "1px solid rgba(22, 52, 36, 0.15)"
          }}
          onClick={() => setMobileOpen(false)}
        >
          <ExternalLink size={18} className="bs-side-icon" color="var(--forest)" /> 
          <span className="bs-side-label">Voir la boutique</span>
        </Link>

        <div className="bs-sidebar-nav">
          {links.map(({ to, label, icon: Icon, exact }) => (
            <NavLink 
              key={to} 
              to={to} 
              end={!!exact}
              title={label}
              className={({ isActive }) => "bs-side-btn" + (isActive ? " active" : "")}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} className="bs-side-icon" /> 
              <span className="bs-side-label">{label}</span>
            </NavLink>
          ))}
        </div>

        <button 
          className="bs-side-btn" 
          style={{ marginTop: "auto" }} 
          onClick={() => {
            setMobileOpen(false);
            logout();
            showToast("Déconnexion réussie. À bientôt !", "info", "Déconnexion");
          }} 
          title="Déconnexion"
        >
          <LogOut size={18} className="bs-side-icon" /> 
          <span className="bs-side-label">Sortir ({user?.nom?.split(" ")[0]})</span>
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="bs-main">
        {/* ADMIN TOPBAR */}
        <div className="bs-admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 500 }}>
              Espace {user?.role === "admin" ? "Administrateur" : user?.role === "employe" ? "Employé" : "Super Admin"}
            </span>

            {/* QUICK LINK BACK TO PUBLIC SITE */}
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: 20,
                color: "var(--forest-dark)",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--forest-light)"; e.currentTarget.style.borderColor = "var(--forest)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.borderColor = "var(--line)"; }}
              title="Retourner sur le site boutique"
            >
              <ArrowLeft size={15} color="var(--forest)" />
              <span>Voir la boutique</span>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* NOTIFICATIONS BELL */}
            <div className="desktop-notifications">
              <NotificationMenu />
            </div>

            <div style={{ width: 1, height: 24, background: "var(--line)" }} className="desktop-divider" />

            {/* AVATAR & USER PROFILE TRIGGER */}
            <button
              onClick={() => setProfileOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10
              }}
              title="Modifier mon profil"
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--forest)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                boxShadow: "0 2px 8px rgba(34,75,53,0.2)"
              }}>
                {user?.nom?.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: "left" }} className="bs-admin-user-info">
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--forest-dark)" }}>{user?.nom}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>{user?.role}</div>
              </div>
            </button>
          </div>
        </div>

        <Outlet />
      </div>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  );
}



