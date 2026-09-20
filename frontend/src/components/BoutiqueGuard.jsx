import React from "react";
import { Store, AlertCircle, RefreshCw } from "lucide-react";
import { useBoutique } from "../context/BoutiqueContext";

export default function BoutiqueGuard({ children }) {
  const { boutique, loading, error, refreshBoutique } = useBoutique();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#F4F7F5", color: "var(--ink)"
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: "50%",
          border: "4px solid var(--forest-light)", borderTopColor: "var(--forest)",
          animation: "spin 1s linear infinite", marginBottom: 16
        }} />
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--forest-dark)" }}>
          Chargement de votre boutique...
        </div>
      </div>
    );
  }

  if (error || !boutique) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#F4F7F5", padding: 24, textAlignment: "center"
      }}>
        <div style={{
          background: "#FFF5F5", border: "1px solid #FED7D7", color: "#C53030",
          width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20
        }}>
          <AlertCircle size={32} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>
          Boutique introuvable
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 440, textAlign: "center", lineHeight: "1.5", fontSize: 14, margin: "0 0 24px 0" }}>
          Le sous-domaine ou l'adresse demandée ne correspond à aucune boutique active sur notre plateforme. Veuillez vérifier l'URL ou essayer plus tard.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={refreshBoutique}
            style={{
              padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border)",
              background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
            }}
          >
            <RefreshCw size={15} />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  if (boutique.statut === "suspendue") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#F4F7F5", padding: 24
      }}>
        <div style={{
          background: "#FFF5F5", border: "1px solid #FED7D7", color: "#C53030",
          width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20
        }}>
          <Store size={32} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>
          Boutique temporairement indisponible
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 460, textAlign: "center", lineHeight: "1.5", fontSize: 14, margin: "0 0 24px 0" }}>
          La boutique <b>« {boutique.nom} »</b> est actuellement suspendue par l'équipe d'administration de la plateforme.
        </p>
      </div>
    );
  }

  return children;
}
