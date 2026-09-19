import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag, Search, ChevronRight, MapPin, CreditCard, ArrowLeft, PackageOpen, TrendingUp } from "lucide-react";
import api, { SLUG } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

const fcfa = (n) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";

const STATUT_CONFIG = {
  en_attente:   { label: "En attente",        color: "#B7791F", bg: "#FFFBEA", Icon: Clock,       step: 0 },
  validee:      { label: "Confirmée",         color: "#2B6CB0", bg: "#EBF4FF", Icon: CheckCircle, step: 1 },
  pret_retrait: { label: "Prête à récupérer", color: "#2D8653", bg: "#EBF7F0", Icon: Package,     step: 2 },
  en_livraison: { label: "En livraison",      color: "#2F6B4F", bg: "#EBF2ED", Icon: Truck,       step: 2 },
  recuperee:    { label: "Récupérée",         color: "#163424", bg: "#EBF7F0", Icon: CheckCircle, step: 3 },
  livree:       { label: "Livrée",            color: "#163424", bg: "#EBF7F0", Icon: CheckCircle, step: 3 },
  annulee:      { label: "Annulée",           color: "#B4483A", bg: "#FDF2F0", Icon: XCircle,     step: -1 },
};

const DELIVERY_STEPS = [
  { key: "en_attente",   label: "Reçue",        icon: ShoppingBag },
  { key: "validee",      label: "Confirmée",    icon: CheckCircle },
  { key: "en_livraison", label: "En livraison", icon: Truck },
  { key: "livree",       label: "Livrée",       icon: CheckCircle },
];
const PICKUP_STEPS = [
  { key: "en_attente",   label: "Reçue",             icon: ShoppingBag },
  { key: "validee",      label: "Confirmée",          icon: CheckCircle },
  { key: "pret_retrait", label: "Prête à récupérer", icon: Package },
  { key: "recuperee",    label: "Récupérée",         icon: CheckCircle },
];

const MOYEN_LABEL = {
  cash: "Espèces (Cash)",
  mvola: "Mvola",
  holam: "Holam",
  carte: "Carte bancaire",
};

const FILTERS = [
  { key: "all",          label: "Toutes les commandes", icon: ShoppingBag },
  { key: "en_attente",   label: "En attente",            icon: Clock },
  { key: "validee",      label: "Confirmées",            icon: CheckCircle },
  { key: "pret_retrait", label: "Prêtes à récupérer",   icon: Package },
  { key: "en_livraison", label: "En livraison",          icon: Truck },
  { key: "recuperee",    label: "Récupérées",            icon: CheckCircle },
  { key: "livree",       label: "Livrées",               icon: CheckCircle },
  { key: "annulee",      label: "Annulées",              icon: XCircle },
];


import { subscribeRealtime } from "../../utils/realtime.js";

export default function MyOrders() {
  const { boutique } = useAuth();
  const [searchParams] = useSearchParams();
  const targetOrderId = searchParams.get("orderId") || searchParams.get("id");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchOrders = () => {
    api.get(`/store/${SLUG}/orders/mine`)
      .then(res => {
        const freshOrders = res.data || [];
        setOrders(freshOrders);

        // Auto-sélection si une commande est spécifiée dans l'URL (?orderId=18)
        if (targetOrderId && !selected) {
          const target = freshOrders.find(o => String(o.id) === String(targetOrderId));
          if (target) setSelected(target);
        } else {
          // Auto-update selected order if currently open
          setSelected(prev => {
            if (!prev) return null;
            const found = freshOrders.find(o => o.id === prev.id);
            return found || prev;
          });
        }
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetchOrders();

    // 1. Realtime SSE push listener
    const unsubscribe = subscribeRealtime((detail) => {
      if (detail.type === "order_updated" || detail.type === "order_created") {
        fetchOrders();
      }
    });

    // 2. Smart 4s polling interval
    const interval = setInterval(fetchOrders, 4000);

    // 3. Window focus / tab active refresh
    const onFocus = () => fetchOrders();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = search === "" ||
      `${o.id}`.includes(search) ||
      o.items?.some(it => it.product?.nom?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || o.statut === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: orders.length,
    enCours: orders.filter(o => !["livree", "annulee"].includes(o.statut)).length,
    livrees: orders.filter(o => o.statut === "livree").length,
    annulees: orders.filter(o => o.statut === "annulee").length,
    montant: orders.filter(o => o.statut !== "annulee").reduce((s, o) => s + (o.total || 0), 0),
  };

  async function cancelOrder(id) {
    if (!window.confirm(`Voulez-vous vraiment annuler votre commande #${id} ?`)) return;
    try {
      await api.patch(`/store/${SLUG}/orders/${id}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, statut: "annulee" } : o))
      );
      if (selected && selected.id === id) {
        setSelected((prev) => ({ ...prev, statut: "annulee" }));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'annuler cette commande.");
    }
  }

  // ─── DETAIL VIEW ───────────────────────────────────────────────────────────
  if (selected) {
    const o = selected;
    const cfg = STATUT_CONFIG[o.statut] || STATUT_CONFIG["en_attente"];
    const isDelivery = o.modeLivraison === "domicile";
    const steps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;
    const currentStep = cfg.step;

    return (
      <div className="bs-my-orders-detail-layout">

        {/* ── MAIN DETAIL ── */}
        <div className="bs-my-orders-detail-main">
          <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 13, fontWeight: 600, padding: "0 0 20px", marginBottom: 8 }}>
            <ArrowLeft size={15} /> Retour à mes commandes
          </button>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "var(--forest-dark)", margin: "0 0 6px" }}>Commande #{o.id}</h1>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Passée le {new Date(o.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!["livree", "recuperee", "en_livraison", "annulee"].includes(o.statut) && (
                <button
                  onClick={() => cancelOrder(o.id)}
                  style={{
                    background: "#FDF2F0", color: "#B4483A", border: "1px solid #F8D7D2",
                    padding: "8px 16px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                  }}
                >
                  <XCircle size={15} /> Annuler ma commande
                </button>
              )}
              <span style={{ background: cfg.bg, color: cfg.color, padding: "8px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* SUIVI TIMELINE */}
          {o.statut !== "annulee" && (
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(34,75,53,0.05)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 15, color: "var(--forest-dark)", fontWeight: 700 }}>
                {isDelivery ? "Suivi de votre livraison" : "Suivi — Retrait en boutique"}
              </h3>
              <div style={{ display: "flex", alignItems: "flex-start", overflowX: "auto", paddingBottom: 8 }}>
                {steps.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.key} style={{ flex: 1, minWidth: 70, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      {i > 0 && <div style={{ position: "absolute", left: 0, top: 18, width: "50%", height: 3, background: i <= currentStep ? "var(--forest)" : "var(--line)" }} />}
                      {i < steps.length - 1 && <div style={{ position: "absolute", right: 0, top: 18, width: "50%", height: 3, background: i < currentStep ? "var(--forest)" : "var(--line)" }} />}
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", zIndex: 1,
                        background: done ? "var(--forest)" : "#fff",
                        border: `3px solid ${done ? "var(--forest)" : "var(--line)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: active ? "0 0 0 6px rgba(34,75,53,0.1)" : "none",
                        transition: "all 0.3s"
                      }}>
                        <step.icon size={16} color={done ? "#fff" : "#ccc"} />
                      </div>
                      <div style={{ textAlign: "center", marginTop: 8, padding: "0 2px" }}>
                        <div style={{ fontSize: 11, fontWeight: done ? 700 : 500, color: done ? "var(--forest-dark)" : "var(--muted)", whiteSpace: "nowrap" }}>{step.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 20, background: "var(--forest-light)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <cfg.Icon size={18} color="var(--forest)" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--forest-dark)" }}>
                  {o.statut === "livree" && "Votre commande a été livrée avec succès !"}
                  {o.statut === "en_livraison" && "Votre livreur est en route ! Préparez-vous à le recevoir."}
                  {o.statut === "en_preparation" && "Votre commande est en cours de préparation."}
                  {o.statut === "validee" && "Votre commande a été confirmée. Préparation en cours."}
                  {o.statut === "en_attente" && "Commande reçue, en attente de confirmation."}
                  {o.statut === "pret_retrait" && "Votre commande est prête ! Venez la récupérer en boutique."}
                </span>
              </div>
            </div>
          )}

          {o.statut === "annulee" && (
            <div style={{ background: "#FDF2F0", border: "1px solid #F8D7D2", borderRadius: 16, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 14 }}>
              <XCircle size={24} color="#B4483A" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#B4483A", fontSize: 14, marginBottom: 4 }}>Commande annulée</div>
                <div style={{ fontSize: 12.5, color: "#B4483A", opacity: 0.8 }}>Cette commande a été annulée et ne sera pas traitée.</div>
              </div>
            </div>
          )}

          {/* INFOS LIVRAISON + PAIEMENT */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            {[
              {
                label: "Mode de livraison",
                content: isDelivery ? "Livraison à domicile" : "Retrait en boutique",
                sub: isDelivery ? o.adresseLivraison : (boutique?.adresse ? `Point de retrait : ${boutique.adresse}` : null),
                Icon: isDelivery ? Truck : Package,
              },
              {
                label: "Moyen de paiement",
                content: MOYEN_LABEL[o.moyenPaiement] || o.moyenPaiement,
                sub: null,
                Icon: CreditCard,
              },
            ].map((info, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{info.label}</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--forest-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <info.Icon size={16} color="var(--forest)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>{info.content}</div>
                    {info.sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, display: "flex", gap: 4 }}><MapPin size={12} style={{ flexShrink: 0, marginTop: 1 }} />{info.sub}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ARTICLES */}
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--forest-dark)" }}>Articles commandés</span>
            </div>
            {o.items?.map((it, idx) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: idx < o.items.length - 1 ? "1px solid var(--line)" : "none" }}>
                <img src={it.product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=80&q=80"} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.product?.nom}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{fcfa(it.prixUnitaire)} · ×{it.quantite}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--forest-dark)", flexShrink: 0 }}>{fcfa(it.prixUnitaire * it.quantite)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: FINANCIAL SUMMARY ── */}
        <div className="bs-my-orders-detail-summary">
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--forest-dark)", margin: "0 0 20px" }}>Résumé financier</h2>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13.5 }}>
            <span style={{ color: "var(--muted)" }}>Sous-total</span><span style={{ fontWeight: 600 }}>{fcfa(o.sousTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, fontSize: 13.5 }}>
            <span style={{ color: "var(--muted)" }}>Frais de livraison</span>
            <span style={{ fontWeight: 600, color: o.fraisLivraison === 0 ? "#2D8653" : "var(--ink)" }}>{o.fraisLivraison === 0 ? "Gratuits" : fcfa(o.fraisLivraison)}</span>
          </div>
          <div style={{ background: "var(--forest-dark)", borderRadius: 16, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#DDE8DF", fontWeight: 600, fontSize: 14 }}>Total payé</span>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>{fcfa(o.total)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--muted)", gap: 12, fontSize: 15 }}>
      <span style={{ width: 20, height: 20, border: "2.5px solid var(--line)", borderTopColor: "var(--forest)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
      Chargement de vos commandes...
    </div>
  );

  return (
    <div className="bs-my-orders-layout">

      {/* ── SIDEBAR ── */}
      <div className="bs-my-orders-sidebar">
        <div className="filter-title" style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: 12 }}>
          Filtrer par statut
        </div>
        {FILTERS.map(f => {
          const count = f.key === "all" ? orders.length : orders.filter(o => o.statut === f.key).length;
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 20,
              background: active ? "var(--forest-dark)" : "#fff",
              border: active ? "1px solid var(--forest-dark)" : "1px solid var(--line)",
              color: active ? "#fff" : "var(--ink)",
              fontWeight: active ? 800 : 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.15s", flexShrink: 0
            }}>
              <f.icon size={15} color={active ? "#fff" : "var(--forest)"} />
              <span>{f.label}</span>
              <span style={{ background: active ? "rgba(255,255,255,0.2)" : "var(--line)", color: active ? "#fff" : "var(--muted)", borderRadius: 12, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="bs-my-orders-main">
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, color: "var(--forest-dark)", margin: "0 0 4px" }}>Mes commandes</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Suivez l'état de toutes vos commandes en temps réel.</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="bs-my-orders-kpis">
          {[
            { label: "Total",      value: stats.total,    color: "var(--forest)", bg: "var(--forest-light)", Icon: ShoppingBag },
            { label: "En cours",   value: stats.enCours,  color: "#D97724",       bg: "#FDF4EB",             Icon: Clock },
            { label: "Livrées",    value: stats.livrees,  color: "#2B6CB0",       bg: "#EBF4FF",             Icon: CheckCircle },
            { label: "Annulées",   value: stats.annulees, color: "#B4483A",       bg: "#FDF2F0",             Icon: XCircle },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <kpi.Icon size={18} color={kpi.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>{kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input className="bs-input" style={{ paddingLeft: 42, borderRadius: 12, fontSize: 13.5, background: "#fff" }}
            placeholder="Rechercher une commande..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* LIST */}
        {filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "var(--muted)", textAlign: "center", background: "#fff", borderRadius: 16, border: "1px solid var(--line)" }}>
            <PackageOpen size={48} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--ink)" }}>Aucune commande trouvée</div>
            <div style={{ fontSize: 12.5 }}>Essayez d'autres critères de recherche ou un autre filtre.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(o => {
              const cfg = STATUT_CONFIG[o.statut] || STATUT_CONFIG["en_attente"];
              const isDelivery = o.modeLivraison === "domicile";
              return (
                <div key={o.id} onClick={() => setSelected(o)} className="bs-my-orders-card">
                  {/* Product thumbnails + info row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", flexShrink: 0 }}>
                        {o.items?.slice(0, 3).map((it, idx) => (
                          <img key={it.id} src={it.product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=60&q=80"} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginLeft: idx > 0 ? -12 : 0, zIndex: 3 - idx }} />
                        ))}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink)" }}>Commande #{o.id}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                          {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>

                    <span style={{ background: cfg.bg, color: cfg.color, padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Articles summary + price row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 10 }}>
                      {isDelivery ? "Livraison domicile" : "Retrait boutique"} · {o.items?.length} article{o.items?.length > 1 ? "s" : ""}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 16, color: "var(--forest-dark)" }}>{fcfa(o.total)}</div>
                      <ChevronRight size={18} color="var(--muted)" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
