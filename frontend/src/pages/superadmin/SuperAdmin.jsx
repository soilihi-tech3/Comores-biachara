import React, { useEffect, useState } from "react";
import { 
  Shield, Building2, PauseCircle, PlayCircle, LogOut, PlusCircle, 
  Pencil, Trash2, Search, TrendingUp, DollarSign, Store, KeyRound, 
  CheckCircle2, XCircle, X, RefreshCw, Sliders, ToggleLeft, ToggleRight
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

const fcfa = (n) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";

const DEFAULT_MODULES = {
  vente: true,
  ventesHistorique: true,
  achats: true,
  fournisseurs: true,
  unites: true,
  homeBanners: true,
  sideBanners: true,
  commandes: true,
  categories: true,
  produits: true
};

const MODULE_LABELS = [
  { key: "vente", label: "Vente Directe (POS Caisse)", desc: "Gestion des ventes comptoir et encaissement direct" },
  { key: "ventesHistorique", label: "Historique des Ventes", desc: "Consultation du journal des ventes et reçus" },
  { key: "achats", label: "Achats & Stocks", desc: "Approvisionnements, entrées de stock et coût d'achat" },
  { key: "fournisseurs", label: "Fournisseurs", desc: "Gestion des partenaires et fiches fournisseurs" },
  { key: "unites", label: "Unités de vente", desc: "Configuration des unités (Kg, Litre, Pièce, Carton...)" },
  { key: "homeBanners", label: "Home Banners (Slider)", desc: "Bannières principales défilantes de la page d'accueil" },
  { key: "sideBanners", label: "Home Side Banners", desc: "Bannières promotionnelles secondaires" },
  { key: "commandes", label: "Gestion des Commandes", desc: "Suivi, validation et attribution des commandes en ligne" },
  { key: "categories", label: "Catégories", desc: "Gestion des rayons et catégories de produits" },
  { key: "produits", label: "Catalogue Produits", desc: "Gestion des fiches produits, prix et stocks" }
];

export default function SuperAdmin() {
  const { user, logout } = useAuth();
  const [boutiques, setBoutiques] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "boutiques"
  const [search, setSearch] = useState("");
  
  // Modals state
  const [createForm, setCreateForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [modulesForm, setModulesForm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    api.get("/superadmin/boutiques")
      .then((res) => setBoutiques(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get("/superadmin/stats")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }

  useEffect(load, []);

  async function toggleStatus(b) {
    try {
      const nextStatus = b.statut === "active" ? "suspendue" : "active";
      await api.patch(`/superadmin/boutiques/${b.id}/statut`, { statut: nextStatus });
      setSucces(`Boutique « ${b.nom} » ${nextStatus === "active" ? "activée" : "désactivée"}.`);
      setTimeout(() => setSucces(""), 3000);
      load();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors du changement de statut.");
    }
  }

  async function submitCreate() {
    setErreur("");
    try {
      await api.post("/superadmin/boutiques", createForm);
      setCreateForm(null);
      setSucces("Nouvelle boutique créée avec succès !");
      setTimeout(() => setSucces(""), 3000);
      load();
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de créer la boutique.");
    }
  }

  async function submitEdit() {
    setErreur("");
    try {
      await api.put(`/superadmin/boutiques/${editForm.id}`, {
        nom: editForm.nom,
        slug: editForm.slug,
        formuleAbonnement: editForm.formuleAbonnement,
        motDePasseAdmin: editForm.motDePasseAdmin
      });
      setEditForm(null);
      setSucces("Boutique mise à jour avec succès !");
      setTimeout(() => setSucces(""), 3000);
      load();
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de modifier la boutique.");
    }
  }

  async function submitModules() {
    if (!modulesForm) return;
    setErreur("");
    try {
      await api.put(`/superadmin/boutiques/${modulesForm.id}/modules`, {
        modulesActifs: modulesForm.modulesActifs
      });
      setModulesForm(null);
      setSucces(`Modules de la boutique « ${modulesForm.nom} » mis à jour !`);
      setTimeout(() => setSucces(""), 3000);
      load();
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de modifier les modules.");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setErreur("");
    try {
      await api.delete(`/superadmin/boutiques/${deleteId}`);
      setDeleteId(null);
      setSucces("Boutique supprimée avec succès.");
      setTimeout(() => setSucces(""), 3000);
      load();
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de supprimer la boutique.");
    }
  }

  const filteredBoutiques = boutiques.filter(b => 
    b.nom?.toLowerCase().includes(search.toLowerCase()) ||
    b.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh", background: "#F4F7F5" }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        background: "var(--forest-dark)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "24px 18px",
        boxShadow: "4px 0 20px rgba(0,0,0,0.15)"
      }}>
        {/* BRAND */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.12)",
          marginBottom: 28
        }}>
          <div style={{
            background: "var(--accent)", color: "#fff",
            borderRadius: 12, width: 42, height: 42,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#fff" }}>Super Admin</div>
            <div style={{ fontSize: 12, color: "#A8C3B3" }}>Console Plateforme</div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => setActiveTab("dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 12, border: "none",
              background: activeTab === "dashboard" ? "rgba(255,255,255,0.14)" : "transparent",
              color: activeTab === "dashboard" ? "#fff" : "#C2D5C8",
              fontWeight: activeTab === "dashboard" ? 700 : 500,
              fontSize: 14, cursor: "pointer", transition: "all 0.15s ease", textAlign: "left"
            }}
          >
            <TrendingUp size={18} />
            <span>Vue d'ensemble</span>
          </button>

          <button
            onClick={() => setActiveTab("boutiques")}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 12, border: "none",
              background: activeTab === "boutiques" ? "rgba(255,255,255,0.14)" : "transparent",
              color: activeTab === "boutiques" ? "#fff" : "#C2D5C8",
              fontWeight: activeTab === "boutiques" ? 700 : 500,
              fontSize: 14, cursor: "pointer", transition: "all 0.15s ease", textAlign: "left"
            }}
          >
            <Store size={18} />
            <span>Gestion Boutiques</span>
            <span style={{
              marginLeft: "auto", background: "rgba(255,255,255,0.2)",
              borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700
            }}>
              {boutiques.length}
            </span>
          </button>

          <button
            onClick={() => setCreateForm({ nomBoutique: "", slug: "", formuleAbonnement: "commission", nomAdmin: "", emailAdmin: "", motDePasseAdmin: "" })}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
              background: "var(--accent)", color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 16,
              transition: "all 0.2s ease"
            }}
          >
            <PlusCircle size={18} />
            <span>Nouvelle Boutique</span>
          </button>
        </nav>

        {/* FOOTER USER / LOGOUT */}
        <div style={{
          paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{user?.nom || "Super Administrateur"}</div>
            <div style={{ fontSize: 11, color: "#A8C3B3" }}>{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title="Déconnexion"
            style={{
              background: "rgba(255,255,255,0.1)", border: "none",
              borderRadius: 10, width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", cursor: "pointer", transition: "background 0.2s"
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ padding: "36px 40px", overflowY: "auto" }}>
        {/* HEADER TOOLBAR */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 32
        }}>
          <div>
            <h1 style={{ fontSize: 28, margin: 0, color: "var(--forest-dark)", fontWeight: 800 }}>
              Console Super Administrateur
            </h1>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>
              Gérez toutes les boutiques e-commerce de la plateforme EasyMarket
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={load}
              title="Rafraîchir les données"
              style={{
                background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
                padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
                fontSize: 13.5, fontWeight: 600, color: "var(--ink)", cursor: "pointer"
              }}
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={() => setCreateForm({ nomBoutique: "", slug: "", formuleAbonnement: "commission", nomAdmin: "", emailAdmin: "", motDePasseAdmin: "" })}
              className="bs-btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
            >
              <PlusCircle size={16} />
              <span>Ajouter une boutique</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {succes && (
          <div style={{
            background: "#EBF7F0", color: "#1F4D3A", border: "1px solid #C4E5D3",
            padding: "14px 18px", borderRadius: 12, fontWeight: 600, fontSize: 14,
            marginBottom: 24, display: "flex", alignItems: "center", gap: 10
          }}>
            <CheckCircle2 size={18} />
            <span>{succes}</span>
          </div>
        )}
        {erreur && (
          <div style={{
            background: "#FDF2F0", color: "#B4483A", border: "1px solid #F8D7D2",
            padding: "14px 18px", borderRadius: 12, fontWeight: 600, fontSize: 14,
            marginBottom: 24, display: "flex", alignItems: "center", gap: 10
          }}>
            <XCircle size={18} />
            <span>{erreur}</span>
          </div>
        )}

        {/* ── KPI STATS CARDS ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20, marginBottom: 36
        }}>
          {/* KPI 1 */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "20px 24px",
            border: "1px solid var(--line)", boxShadow: "0 2px 10px rgba(34,75,53,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Boutiques Actives</span>
              <div style={{ background: "var(--forest-light)", color: "var(--forest)", borderRadius: 10, padding: 8 }}>
                <Store size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--forest-dark)" }}>
              {stats?.nbBoutiquesActives || 0} <span style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)" }}>/ {stats?.nbBoutiques || 0}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {boutiques.filter(b => b.statut === "suspendue").length} boutique(s) suspendue(s)
            </div>
          </div>

          {/* KPI 2 */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "20px 24px",
            border: "1px solid var(--line)", boxShadow: "0 2px 10px rgba(34,75,53,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Chiffre d'Affaires Global</span>
              <div style={{ background: "var(--accent-light)", color: "var(--accent)", borderRadius: 10, padding: 8 }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--forest-dark)" }}>
              {fcfa(stats?.chiffreAffairesCumule || 0)}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              Volume total des ventes réalisées
            </div>
          </div>

          {/* KPI 3 */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "20px 24px",
            border: "1px solid var(--line)", boxShadow: "0 2px 10px rgba(34,75,53,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Ventes Cumulées</span>
              <div style={{ background: "var(--forest-light)", color: "var(--forest)", borderRadius: 10, padding: 8 }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--forest-dark)" }}>
              {stats?.nbVentesCumulees || 0}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              Commandes enregistrées
            </div>
          </div>

          {/* KPI 4 */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "20px 24px",
            border: "1px solid var(--line)", boxShadow: "0 2px 10px rgba(34,75,53,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Formule Médiane</span>
              <div style={{ background: "#E8F0FE", color: "#1B66C9", borderRadius: 10, padding: 8 }}>
                <Shield size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--forest-dark)" }}>
              Commission 5%
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              Formule principale active
            </div>
          </div>
        </div>

        {/* ── TABLE DES BOUTIQUES ── */}
        <div style={{
          background: "#fff", borderRadius: 20, padding: 28,
          border: "1px solid var(--line)", boxShadow: "0 4px 20px rgba(34,75,53,0.05)"
        }}>
          {/* Table Header Controls */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20, gap: 16
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--forest-dark)" }}>Liste des boutiques clientes</h3>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                {filteredBoutiques.length} boutique(s) enregistrée(s)
              </div>
            </div>

            <div style={{ position: "relative", width: 280 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                className="bs-input"
                placeholder="Rechercher une boutique..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, borderRadius: 20, fontSize: 13 }}
              />
            </div>
          </div>

          <table className="bs-table">
            <thead>
              <tr>
                <th>Boutique</th>
                <th>Formule</th>
                <th>CA Réalisé</th>
                <th>Ventes</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBoutiques.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>
                    Aucune boutique trouvée.
                  </td>
                </tr>
              ) : (
                filteredBoutiques.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, background: "var(--forest-light)",
                          display: "flex", alignItems: "center", justifyContent: "center", color: "var(--forest)",
                          fontWeight: 700, fontSize: 14
                        }}>
                          {b.nom?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{b.nom}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>slug: /{b.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: "var(--paper)", border: "1px solid var(--line)"
                      }}>
                        {b.formuleAbonnement || "Commission 5%"}
                      </span>
                    </td>
                    <td className="num" style={{ fontWeight: 700, color: "var(--forest-dark)" }}>
                      {fcfa(b.chiffreAffaires || 0)}
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {b.nbVentes || 0}
                    </td>
                    <td>
                      <span 
                        style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background: b.statut === "active" ? "#EBF7F0" : "#FDF2F0",
                          color: b.statut === "active" ? "#1F4D3A" : "#B4483A",
                          border: `1px solid ${b.statut === "active" ? "#C4E5D3" : "#F8D7D2"}`
                        }}
                      >
                        {b.statut === "active" ? "Active" : "Suspendue"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {/* TOGGLE STATUS */}
                        <button 
                          onClick={() => toggleStatus(b)} 
                          title={b.statut === "active" ? "Désactiver la boutique" : "Activer la boutique"}
                          style={{
                            background: b.statut === "active" ? "#FDF2F0" : "#EBF7F0",
                            color: b.statut === "active" ? "#B4483A" : "#1F4D3A",
                            border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600
                          }}
                        >
                          {b.statut === "active" ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                          <span>{b.statut === "active" ? "Désactiver" : "Activer"}</span>
                        </button>

                        {/* MODULES & ACCÈS BUTTON */}
                        <button
                          onClick={() => setModulesForm({
                            id: b.id,
                            nom: b.nom,
                            modulesActifs: { ...DEFAULT_MODULES, ...(b.modulesActifs || {}) }
                          })}
                          title="Gérer les fonctionnalités et accès aux modules"
                          style={{
                            background: "var(--forest-light)", color: "var(--forest-dark)", border: "1px solid rgba(34,75,53,0.15)",
                            borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700
                          }}
                        >
                          <Sliders size={14} />
                          <span>Modules & Accès</span>
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => setEditForm({ id: b.id, nom: b.nom, slug: b.slug, formuleAbonnement: b.formuleAbonnement, motDePasseAdmin: "" })}
                          title="Modifier la boutique & mot de passe admin"
                          style={{
                            background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)",
                            borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600
                          }}
                        >
                          <Pencil size={14} />
                          <span>Modifier</span>
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => setDeleteId(b.id)}
                          title="Supprimer la boutique"
                          style={{
                            background: "#FDF2F0", color: "#B4483A", border: "1px solid #F8D7D2",
                            borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── MODAL: CREATION BOUTIQUE ── */}
      {createForm && (
        <div className="bs-modal-bg" onClick={() => setCreateForm(null)} style={{
          position: "fixed", inset: 0, background: "rgba(22,52,36,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="bs-modal" onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: 32, maxWidth: 520, width: "90%",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--forest-dark)" }}>Créer une nouvelle boutique</h2>
              <button onClick={() => setCreateForm(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {erreur && <div className="bs-error" style={{ marginBottom: 16 }}>{erreur}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Nom de la boutique</label>
                <input
                  className="bs-input"
                  placeholder="ex: Épicerie Bio Dakar"
                  value={createForm.nomBoutique}
                  onChange={(e) => setCreateForm(f => ({ ...f, nomBoutique: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Slug (URL unique)</label>
                <input
                  className="bs-input"
                  placeholder="ex: epicerie-bio-dakar"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Formule d'abonnement</label>
                <select
                  className="bs-select"
                  value={createForm.formuleAbonnement}
                  onChange={(e) => setCreateForm(f => ({ ...f, formuleAbonnement: e.target.value }))}
                >
                  <option value="commission">Commission 5%</option>
                  <option value="forfait_mensuel">Forfait Mensuel Fixe</option>
                  <option value="essai_gratuit">Essai Gratuit 14 jours</option>
                </select>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "8px 0" }} />

              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--forest-dark)" }}>Compte Administrateur Boutique</div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Nom du gérant / Admin</label>
                <input
                  className="bs-input"
                  placeholder="ex: Mamadou Diallo"
                  value={createForm.nomAdmin}
                  onChange={(e) => setCreateForm(f => ({ ...f, nomAdmin: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Email de connexion</label>
                <input
                  className="bs-input"
                  type="email"
                  placeholder="ex: admin@epiceriebio.sn"
                  value={createForm.emailAdmin}
                  onChange={(e) => setCreateForm(f => ({ ...f, emailAdmin: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Mot de passe temporaire</label>
                <input
                  className="bs-input"
                  type="text"
                  placeholder="ex: Pass1234!"
                  value={createForm.motDePasseAdmin}
                  onChange={(e) => setCreateForm(f => ({ ...f, motDePasseAdmin: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setCreateForm(null)}
                  style={{ flex: 1, padding: "12px", borderRadius: 30, border: "1px solid var(--line)", background: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="bs-btn-primary"
                  style={{ flex: 1 }}
                  disabled={!createForm.nomBoutique || !createForm.slug || !createForm.emailAdmin}
                  onClick={submitCreate}
                >
                  Créer la boutique
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MODIFICATION BOUTIQUE & MOT DE PASSE ── */}
      {editForm && (
        <div className="bs-modal-bg" onClick={() => setEditForm(null)} style={{
          position: "fixed", inset: 0, background: "rgba(22,52,36,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="bs-modal" onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: 32, maxWidth: 500, width: "90%",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--forest-dark)" }}>Modifier la boutique</h2>
              <button onClick={() => setEditForm(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {erreur && <div className="bs-error" style={{ marginBottom: 16 }}>{erreur}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Nom de la boutique</label>
                <input
                  className="bs-input"
                  value={editForm.nom}
                  onChange={(e) => setEditForm(f => ({ ...f, nom: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Slug (URL)</label>
                <input
                  className="bs-input"
                  value={editForm.slug}
                  onChange={(e) => setEditForm(f => ({ ...f, slug: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>Formule d'abonnement</label>
                <select
                  className="bs-select"
                  value={editForm.formuleAbonnement}
                  onChange={(e) => setEditForm(f => ({ ...f, formuleAbonnement: e.target.value }))}
                >
                  <option value="commission">Commission 5%</option>
                  <option value="forfait_mensuel">Forfait Mensuel Fixe</option>
                  <option value="essai_gratuit">Essai Gratuit 14 jours</option>
                </select>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "8px 0" }} />

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--forest-dark)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <KeyRound size={15} /> Réinitialiser le mot de passe de l'administrateur
                </label>
                <input
                  className="bs-input"
                  type="text"
                  placeholder="Laissez vide pour conserver l'actuel"
                  value={editForm.motDePasseAdmin}
                  onChange={(e) => setEditForm(f => ({ ...f, motDePasseAdmin: e.target.value }))}
                />
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                  Si vous saisissez un nouveau mot de passe, il remplacera l'ancien mot de passe de l'admin.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setEditForm(null)}
                  style={{ flex: 1, padding: "12px", borderRadius: 30, border: "1px solid var(--line)", background: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="bs-btn-primary"
                  style={{ flex: 1 }}
                  onClick={submitEdit}
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SUPPRESSION BOUTIQUE ── */}
      {deleteId && (
        <div className="bs-modal-bg" onClick={() => setDeleteId(null)} style={{
          position: "fixed", inset: 0, background: "rgba(22,52,36,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="bs-modal" onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: 32, maxWidth: 440, width: "90%",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)", textAlign: "center"
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "#FDF2F0",
              color: "#B4483A", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: 20, color: "var(--forest-dark)" }}>Supprimer la boutique ?</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 24px", lineHeight: 1.5 }}>
              Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible et supprimera le compte admin associé.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{ flex: 1, padding: "12px", borderRadius: 30, border: "1px solid var(--line)", background: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                style={{ flex: 1, padding: "12px", borderRadius: 30, border: "none", background: "#B4483A", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                Supprimer la boutique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: GESTION DES MODULES & ACCÈS ── */}
      {modulesForm && (
        <div className="bs-modal-bg" onClick={() => setModulesForm(null)} style={{
          position: "fixed", inset: 0, background: "rgba(22,52,36,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="bs-modal" onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 24, padding: 32, maxWidth: 640, width: "92%",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 16px 50px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: "var(--forest-dark)" }}>Gestion des Modules & Fonctionnalités</h2>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  Boutique : <strong>{modulesForm.nom}</strong>
                </div>
              </div>
              <button onClick={() => setModulesForm(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={22} />
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: "var(--muted)", background: "var(--paper)", padding: 12, borderRadius: 12, marginBottom: 20 }}>
              Activez ou désactivez les fonctionnalités accessibles par le gérant et les employés de cette boutique. Un module désactivé affichera une alerte d'indisponibilité temporaire lors de l'accès.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {MODULE_LABELS.map((mod) => {
                const isChecked = !!modulesForm.modulesActifs[mod.key];
                return (
                  <div
                    key={mod.key}
                    onClick={() => {
                      setModulesForm(f => ({
                        ...f,
                        modulesActifs: {
                          ...f.modulesActifs,
                          [mod.key]: !isChecked
                        }
                      }));
                    }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px", borderRadius: 14,
                      border: `1.5px solid ${isChecked ? "var(--forest)" : "var(--line)"}`,
                      background: isChecked ? "var(--forest-light)" : "#FAFAFA",
                      cursor: "pointer", transition: "all 0.2s ease"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isChecked ? "var(--forest-dark)" : "var(--ink)" }}>
                        {mod.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        {mod.desc}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: isChecked ? "var(--forest)" : "var(--muted)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>
                        {isChecked ? "Activé" : "Désactivé"}
                      </span>
                      {isChecked ? (
                        <ToggleRight size={32} color="var(--forest)" />
                      ) : (
                        <ToggleLeft size={32} color="#A0AEC0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 12, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                onClick={() => setModulesForm(null)}
                style={{ flex: 1, padding: "12px", borderRadius: 30, border: "1px solid var(--line)", background: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="bs-btn-primary"
                style={{ flex: 1 }}
                onClick={submitModules}
              >
                Enregistrer les modules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
