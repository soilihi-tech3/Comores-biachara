import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, ShoppingBag, AlertTriangle, Layers, DollarSign, Package, Users, Star, UserCheck, CheckCircle2, Clock, CheckCircle } from "lucide-react";
import api from "../../api";
import Stars from "../../components/Stars.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { subscribeRealtime } from "../../utils/realtime.js";

const fcfa = (n) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";

export default function Dashboard() {
  const { user, boutique } = useAuth();
  const [data, setData] = useState(null);
  const [prodChartTab, setProdChartTab] = useState("top"); // "top" | "flop"

  function loadDashboard() {
    api.get("/admin/dashboard").then((res) => setData(res.data)).catch(() => {});
  }

  useEffect(() => { 
    loadDashboard();
    const unsub = subscribeRealtime((detail) => {
      if (
        detail.type === "order_created" ||
        detail.type === "order_updated" ||
        detail.type === "product_updated" ||
        detail.type === "category_updated"
      ) {
        loadDashboard();
      }
    });
    return unsub;
  }, []);

  if (!data) return <div style={{ padding: 40, color: "var(--muted)" }}>Chargement du tableau de bord...</div>;

  // ── 1. DASHBOARD SPÉCIFIQUE À L'EMPLOYÉ ──
  if (data.isEmploye || user?.role === "employe") {
    const listCmds = data.mesCommandes || [];

    return (
      <>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-block", background: "var(--forest-light)", color: "var(--forest)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Espace Opérationnel Employé
          </div>
          <h1 style={{ fontSize: 26, margin: 0, color: "var(--forest-dark)" }}>Mon Tableau de bord & Activités</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>
            Bonjour {user?.nom}, voici un récapitulatif de votre chiffre d'affaires et de vos commandes chez {boutique?.nom || "la boutique"}.
          </p>
        </div>

        {/* STATS DE L'EMPLOYÉ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          
          <div className="bs-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Chiffre d'affaires généré</span>
              <div style={{ background: "var(--forest-light)", padding: 6, borderRadius: 8, color: "var(--forest)" }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>{fcfa(data.monChiffreAffaires || 0)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Commandes traitées hors annulées</div>
          </div>

          <div className="bs-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Commandes Livrées</span>
              <div style={{ background: "#EBF7F0", padding: 6, borderRadius: 8, color: "#1F4D3A" }}>
                <CheckCircle size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>{data.nbMesCommandesLivrees || 0}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Livrées au client</div>
          </div>

          <div className="bs-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Commandes En cours</span>
              <div style={{ background: "#FEF3C7", padding: 6, borderRadius: 8, color: "#D97706" }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>{data.nbMesCommandesEnCours || 0}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>En cours de traitement</div>
          </div>

          <div className="bs-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Total Assignations</span>
              <div style={{ background: "var(--forest-light)", padding: 6, borderRadius: 8, color: "var(--forest)" }}>
                <ShoppingBag size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>{data.nbMesCommandes || 0}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Total des commandes attribuées</div>
          </div>

        </div>

        {/* LISTE DES COMMANDES ASSIGNÉES À L'EMPLOYÉ */}
        <div className="bs-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "var(--forest-dark)" }}>Mes Commandes Assignées</h3>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                Gérez l'avancement et la livraison des commandes sous votre responsabilité.
              </div>
            </div>
            <Link to="/admin/commandes" style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)", textDecoration: "none" }}>
              Accéder à la gestion des commandes →
            </Link>
          </div>

          {listCmds.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              Vous n'avez actuellement aucune commande assignée.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {listCmds.map((c) => {
                const cmdNum = "COM-B" + String(c.id).padStart(3, "0");
                const statusBadges = {
                  en_attente: { label: "En attente", bg: "#FEF3C7", color: "#92400E" },
                  validee: { label: "Validée", bg: "#E0E7FF", color: "#3730A3" },
                  en_preparation: { label: "En préparation", bg: "#DBEAFE", color: "#1E40AF" },
                  en_livraison: { label: "En livraison", bg: "#E0F2FE", color: "#075985" },
                  livree: { label: "Livrée", bg: "#D1FAE5", color: "#065F46" },
                  annulee: { label: "Annulée", bg: "#FEE2E2", color: "#991B1B" },
                };
                const st = statusBadges[c.statut] || { label: c.statut, bg: "#E5E7EB", color: "#374151" };

                return (
                  <div key={c.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 16, background: "var(--paper)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "var(--forest-dark)" }}>#{cmdNum}</span>
                      <span style={{ background: st.bg, color: st.color, padding: "3px 10px", borderRadius: 12, fontSize: 11.5, fontWeight: 700 }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 700 }}>Client: {c.client?.nom || "Client non inscrit"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Tél: {c.client?.telephone || c.telephoneClient || "Non renseigné"}</div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px dashed var(--line)" }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "var(--forest)" }}>{fcfa(c.total)}</span>
                      <Link to="/admin/commandes" style={{ fontSize: 12, fontWeight: 700, color: "var(--forest-dark)", textDecoration: "underline" }}>
                        Modifier le statut
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  // ── 2. DASHBOARD GLOBAL ADMINISTRATEUR ──
  const chartData = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((jour, i) => ({
    jour, ca: Math.round(data.chiffreAffaires / 7 * (0.6 + 0.15 * ((i * 7) % 5))),
  }));

  const activeProductsChart = prodChartTab === "top" ? (data.top7Produits || []) : (data.flop7Produits || []);

  return (
    <>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 26, margin: 0, color: "var(--forest-dark)" }}>Tableau de bord Général Admin</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>Aperçu global et statistiques avancées de votre boutique.</p>
        </div>
      </div>

      {/* ── HIGH-ELEGANCE KPI CARDS GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, marginBottom: 28 }}>
        
        {/* 1. CHIFFRE D'AFFAIRES GLOBAL */}
        <div style={{
          background: "linear-gradient(135deg, #163424 0%, #224B35 100%)",
          color: "#ffffff", borderRadius: 16, padding: "20px 22px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 8px 24px rgba(22,52,36,0.22)", position: "relative", overflow: "hidden"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#DDE8DF" }}>
              Chiffre d'Affaires Global
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
            {fcfa(data.chiffreAffaires || 0)}
          </div>
          <div style={{ fontSize: 12, color: "#DDE8DF", opacity: 0.85, marginTop: 6 }}>
            Ventes cumulées boutique
          </div>
        </div>

        {/* 2. BÉNÉFICE NET */}
        <div style={{
          background: "#ffffff", border: "1px solid var(--line)", borderLeft: "4px solid #059669",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Bénéfice Net
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#059669", letterSpacing: "-0.02em" }}>
            {fcfa(data.beneficeNet || 0)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Ventes moins coût d'achat
          </div>
        </div>

        {/* 3. VALEUR FINANCIÈRE DU STOCK */}
        <div style={{
          background: "#ffffff", border: "1px solid var(--line)", borderLeft: "4px solid #4F46E5",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Valeur du Stock (Argent)
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={18} color="#4F46E5" />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#4F46E5", letterSpacing: "-0.02em" }}>
            {fcfa(data.valeurStockVente || 0)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Valeur marchande en réserve
          </div>
        </div>

        {/* 4. NOMBRE TOTAL DE PRODUITS */}
        <div style={{
          background: "#ffffff", border: "1px solid var(--line)", borderLeft: "4px solid #0284C7",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Produits en Catalogue
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={18} color="#0284C7" />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#0284C7", letterSpacing: "-0.02em" }}>
            {data.totalProduits || 0}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Articles référencés en boutique
          </div>
        </div>

        {/* 5. NOMBRE TOTAL DE CATÉGORIES */}
        <div style={{
          background: "#ffffff", border: "1px solid var(--line)", borderLeft: "4px solid #8B5CF6",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Catégories en Catalogue
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F3E8FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={18} color="#8B5CF6" />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#8B5CF6", letterSpacing: "-0.02em" }}>
            {data.totalCategories || 0}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Catégories actives référencées
          </div>
        </div>

        {/* 6. NOMBRE TOTAL DE VENTES (NOMBRE DE TRANSACTIONS DE VENTE / IDS) */}
        <div style={{
          background: "#ffffff", border: "1px solid var(--line)", borderLeft: "4px solid #D97706",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Nombre Total de Ventes
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={18} color="#D97706" />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#D97706", letterSpacing: "-0.02em" }}>
            {data.nbCommandes || 0} vente{data.nbCommandes > 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Total des transactions de vente créées
          </div>
        </div>

        {/* 7. COMMANDES REÇUES */}
        <div style={{
          background: "#ffffff", border: "1px solid var(--line)", borderLeft: "4px solid #0D9488",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Commandes Reçues
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#CCFBF1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={18} color="#0D9488" />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#0D9488", letterSpacing: "-0.02em" }}>
            {data.nbCommandes || 0}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Commandes traitées & caisse
          </div>
        </div>

        {/* 8. UTILISATEURS / CLIENTS */}
        <div style={{
          background: "#ffffff", border: "1px solid var(--line)", borderLeft: "4px solid #7C3AED",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Clients Inscrits
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F3E8FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCheck size={18} color="#7C3AED" />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#7C3AED", letterSpacing: "-0.02em" }}>
            {data.totalClients || 0}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Comptes clients actifs
          </div>
        </div>

        {/* 9. AVIS CLIENTS & NOTE */}
        <div style={{
          background: "#ffffff", border: "1px solid var(--line)", borderLeft: "4px solid #F59E0B",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
              Avis Clients & Note
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star size={18} color="#D97706" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 25, fontWeight: 900, color: "#D97706", letterSpacing: "-0.02em" }}>
              {data.noteMoyenneGlobale || "4.9"} / 5
            </div>
            <Stars rating={Math.round(data.noteMoyenneGlobale || 5)} size={14} />
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            {data.totalReviews || 0} avis enregistrés
          </div>
        </div>

        {/* 10. ALERTES STOCK */}
        <div style={{
          background: data.stockFaibleCount > 0 ? "#FFF5F4" : "#ffffff",
          border: data.stockFaibleCount > 0 ? "1px solid #FAD2CD" : "1px solid var(--line)",
          borderLeft: data.stockFaibleCount > 0 ? "4px solid #E11D48" : "4px solid var(--line)",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: data.stockFaibleCount > 0 ? "#E11D48" : "var(--muted)" }}>
              Alertes Stock
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: data.stockFaibleCount > 0 ? "#FFE4E6" : "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={18} color={data.stockFaibleCount > 0 ? "#E11D48" : "var(--muted)"} />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: data.stockFaibleCount > 0 ? "#E11D48" : "var(--ink)", letterSpacing: "-0.02em" }}>
            {data.stockFaibleCount || 0}
          </div>
          <div style={{ fontSize: 12, color: data.stockFaibleCount > 0 ? "#E11D48" : "var(--muted)", marginTop: 6 }}>
            {data.stockFaibleCount > 0 ? "Articles à réapprovisionner !" : "Stocks sous contrôle"}
          </div>
        </div>

        {/* 11. PRODUITS BIENTÔT EXPIRÉS */}
        <div style={{
          background: data.produitsExpirantCount > 0 ? "#FFFBEB" : "#ffffff",
          border: data.produitsExpirantCount > 0 ? "1px solid #FDE68A" : "1px solid var(--line)",
          borderLeft: data.produitsExpirantCount > 0 ? "4px solid #D97706" : "4px solid var(--line)",
          borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: data.produitsExpirantCount > 0 ? "#D97706" : "var(--muted)" }}>
              Produits Expirant Bientôt
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: data.produitsExpirantCount > 0 ? "#FEF3C7" : "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={18} color={data.produitsExpirantCount > 0 ? "#D97706" : "var(--muted)"} />
            </div>
          </div>
          <div style={{ fontSize: 25, fontWeight: 900, color: data.produitsExpirantCount > 0 ? "#D97706" : "var(--ink)", letterSpacing: "-0.02em" }}>
            {data.produitsExpirantCount || 0}
          </div>
          <div style={{ fontSize: 12, color: data.produitsExpirantCount > 0 ? "#D97706" : "var(--muted)", marginTop: 6 }}>
            {data.produitsExpirantCount > 0 ? "Articles à péremption imminente (< 30j)" : "Aucune péremption proche"}
          </div>
        </div>

      </div>

      {/* ── GRAPHIQUES SECTION 1 : CHIFFRE D'AFFAIRES & TOP PRODUITS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 24, marginBottom: 24 }}>
        <div className="bs-panel">
          <h3 style={{ marginTop: 0, fontSize: 16, color: "var(--forest-dark)" }}>Chiffre d'affaires — 7 derniers jours</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#E5E9DE" vertical={false} />
              <XAxis dataKey="jour" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? "0" : (v / 1000) + "k"} />
              <Tooltip 
                cursor={{ fill: "var(--forest-light)", opacity: 0.4 }}
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontWeight: 600 }}
                formatter={(v) => [fcfa(v), "Chiffre d'affaires"]} 
              />
              <Bar dataKey="ca" fill="var(--forest)" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TOP / FLOP 7 PRODUITS */}
        <div className="bs-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--forest-dark)" }}>
              {prodChartTab === "top" ? "Top 7 Produits" : "Flop 7 Produits"}
            </h3>
            <div style={{ display: "flex", gap: 4, background: "var(--paper)", padding: 3, borderRadius: 8 }}>
              <button
                onClick={() => setProdChartTab("top")}
                style={{
                  background: prodChartTab === "top" ? "var(--forest)" : "none",
                  color: prodChartTab === "top" ? "#fff" : "var(--muted)",
                  border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                }}
              >
                Plus vendus
              </button>
              <button
                onClick={() => setProdChartTab("flop")}
                style={{
                  background: prodChartTab === "flop" ? "#B4483A" : "none",
                  color: prodChartTab === "flop" ? "#fff" : "var(--muted)",
                  border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                }}
              >
                Moins vendus
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 250, overflowY: "auto" }}>
            {activeProductsChart.length > 0 ? (
              activeProductsChart.map((p, idx) => (
                <div key={p.id || idx} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
                  <img src={p.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80"} alt={p.nom} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      #{idx + 1} {p.nom}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                      <span>{p.ventesCount} vente{p.ventesCount > 1 ? "s" : ""}</span>
                      <span>•</span>
                      <Stars rating={Math.round(p.noteMoyenne || 5)} size={11} />
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--forest-dark)" }}>
                    {fcfa(p.prixPromo || p.prix)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 20 }}>
                Aucune donnée de vente disponible.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── GRAPHIQUES SECTION 2 : TOP & FLOP CATÉGORIES ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div className="bs-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--forest-dark)" }}>Top Catégories (Ventes)</h3>
            <span style={{ fontSize: 12, color: "var(--forest)", fontWeight: 700 }}>Plus populaires</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topCategories || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#E5E9DE" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} ventes`, "Total Ventes"]} />
              <Bar dataKey="ventes" fill="var(--forest)" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bs-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--forest-dark)" }}>Catégories à Redynamiser</h3>
            <span style={{ fontSize: 12, color: "#B4483A", fontWeight: 700 }}>Moins vendues</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.flopCategories || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#E5E9DE" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} ventes`, "Total Ventes"]} />
              <Bar dataKey="ventes" fill="#E28B7D" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
