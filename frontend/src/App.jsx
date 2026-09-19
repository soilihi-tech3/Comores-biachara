import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

import Home from "./pages/store/Home.jsx";
import Catalogue from "./pages/store/Catalogue.jsx";
import ProductDetail from "./pages/store/ProductDetail.jsx";
import Checkout from "./pages/store/Checkout.jsx";
import Confirmation from "./pages/store/Confirmation.jsx";
import MyOrders from "./pages/store/MyOrders.jsx";
import Login from "./pages/store/Login.jsx";
import Register from "./pages/store/Register.jsx";
import About from "./pages/store/About.jsx";
import Profile from "./pages/store/Profile.jsx";

import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import AdminProduits from "./pages/admin/Produits.jsx";
import AdminCategories from "./pages/admin/Categories.jsx";
import AdminOrders from "./pages/admin/Orders.jsx";
import AdminEmployees from "./pages/admin/Employees.jsx";
import AdminClients from "./pages/admin/Clients.jsx";
import AdminSettings from "./pages/admin/Settings.jsx";

import VenteDirecte from "./pages/admin/VenteDirecte.jsx";
import Fournisseurs from "./pages/admin/Fournisseurs.jsx";
import UnitesVente from "./pages/admin/UnitesVente.jsx";
import Achats from "./pages/admin/Achats.jsx";
import SalesHistory from "./pages/admin/SalesHistory.jsx";

import SuperAdmin from "./pages/superadmin/SuperAdmin.jsx";

import Footer from "./components/Footer.jsx";

function StoreLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <div className="bs-shell" style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  );
}

function WideLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column" }}>{children}</div>
      <Footer />
    </div>
  );
}

import PWAInstallPrompt from "./components/PWAInstallPrompt.jsx";
import { initRealtimeSync, subscribeRealtime } from "./utils/realtime.js";
import { useCart } from "./context/CartContext.jsx";

function RealtimeToastNotifier() {
  const { showToast } = useCart();

  React.useEffect(() => {
    const unsub = subscribeRealtime((detail) => {
      if (!detail || !detail.type) return;
      const type = detail.type;

      if (type === "order_created") {
        showToast("Nouvelle commande enregistrée en direct !", "info");
      } else if (type === "order_updated") {
        showToast("Statut de commande mis à jour !", "info");
      } else if (type === "product_updated") {
        showToast("Le catalogue et les stocks ont été mis à jour.", "info");
      } else if (type === "category_updated") {
        showToast("Nouvelle mise à jour des catégories.", "info");
      } else if (type === "boutique_updated") {
        showToast("Informations de la boutique mises à jour.", "info");
      }
    });

    return unsub;
  }, [showToast]);

  return null;
}

export default function App() {
  React.useEffect(() => {
    initRealtimeSync();
  }, []);

  return (
    <>
      <ScrollToTop />
      <PWAInstallPrompt />
      <RealtimeToastNotifier />
      <Routes>
        {/* --- Boutique (front-office) --- */}
        <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
        <Route path="/a-propos" element={<StoreLayout><About /></StoreLayout>} />
        <Route path="/catalogue" element={<StoreLayout><Catalogue /></StoreLayout>} />
        <Route path="/produit/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />
        <Route path="/connexion" element={<StoreLayout><Login /></StoreLayout>} />
        <Route path="/inscription" element={<StoreLayout><Register /></StoreLayout>} />
        <Route path="/profil" element={
          <ProtectedRoute roles={["client", "admin", "employe", "super_admin"]}><WideLayout><Profile /></WideLayout></ProtectedRoute>
        } />
        <Route path="/commander" element={
          <ProtectedRoute roles={["client"]}><WideLayout><Checkout /></WideLayout></ProtectedRoute>
        } />
        <Route path="/confirmation/:id" element={
          <ProtectedRoute roles={["client"]}><WideLayout><Confirmation /></WideLayout></ProtectedRoute>
        } />
        <Route path="/mes-commandes" element={
          <ProtectedRoute roles={["client"]}><WideLayout><MyOrders /></WideLayout></ProtectedRoute>
        } />

        {/* --- Back-office Admin / Employé --- */}
        <Route path="/admin" element={
          <ProtectedRoute roles={["admin", "employe"]}><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="vente" element={<VenteDirecte />} />
          <Route path="ventes-historique" element={<SalesHistory />} />
          <Route path="achats" element={<Achats />} />
          <Route path="fournisseurs" element={<Fournisseurs />} />
          <Route path="unites" element={<UnitesVente />} />
          <Route path="home-banners" element={<AdminSettings defaultTab="home_banners" />} />
          <Route path="side-banners" element={<AdminSettings defaultTab="side_banners" />} />
          <Route path="produits" element={<AdminProduits />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="commandes" element={<AdminOrders />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="employes" element={<AdminEmployees />} />

          <Route path="utilisateurs" element={<AdminEmployees />} />
          <Route path="parametres" element={<AdminSettings defaultTab="general" />} />
        </Route>

        {/* --- Console Super Admin --- */}
        <Route path="/super-admin" element={
          <ProtectedRoute roles={["super_admin"]}><SuperAdmin /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}
