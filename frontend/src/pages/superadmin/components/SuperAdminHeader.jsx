import React from "react";
import { RefreshCw, PlusCircle } from "lucide-react";

export default function SuperAdminHeader({ onRefresh, onNewBoutique, loading }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 28, flexWrap: "wrap", gap: 16
    }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", fontFamily: "serif", margin: 0 }}>
          Console Super Administrateur
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "4px 0 0 0" }}>
          Gérez toutes les boutiques e-commerce et administrateurs de la plateforme EasyMarket
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border)",
            background: "#fff", color: "var(--ink)", fontWeight: 600, fontSize: 13,
            cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.04)"
          }}
        >
          <RefreshCw size={15} className={loading ? "spin" : ""} />
          <span>Actualiser</span>
        </button>

        <button
          onClick={onNewBoutique}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 12, border: "none",
            background: "var(--forest-dark)", color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(26,60,44,0.2)"
          }}
        >
          <PlusCircle size={16} />
          <span>Ajouter une boutique</span>
        </button>
      </div>
    </header>
  );
}
