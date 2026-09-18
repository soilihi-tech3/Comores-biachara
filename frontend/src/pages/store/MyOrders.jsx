import React, { useEffect, useState } from "react";
import { Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag, Search, ChevronRight, MapPin, CreditCard, ArrowLeft, PackageOpen, TrendingUp } from "lucide-react";
import api, { SLUG } from "../../api";

const fcfa = (n) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";

const STATUT_CONFIG = {
  en_attente:     { label: "En attente",        color: "#B7791F", bg: "#FFFBEA", Icon: Clock,       step: 0 },
  validee:        { label: "Confirmée",          color: "#2B6CB0", bg: "#EBF4FF", Icon: CheckCircle, step: 1 },
  en_preparation: { label: "Confirmée",          color: "#2B6CB0", bg: "#EBF4FF", Icon: CheckCircle, step: 1 },
  en_livraison:   { label: "Livraison",          color: "#2F6B4F", bg: "#EBF2ED", Icon: Truck,       step: 3 },
  recuperee:      { label: "Récupérée",          color: "#1F4D3A", bg: "#EBF2ED", Icon: CheckCircle, step: 4 },
  livree:         { label: "Récupérée",          color: "#1F4D3A", bg: "#EBF2ED", Icon: CheckCircle, step: 4 },
  pret_retrait:   { label: "Prête à récupérer", color: "#2B6CB0", bg: "#EBF4FF", Icon: Package,     step: 3 },
  annulee:        { label: "Annulée",            color: "#B4483A", bg: "#FDF2F0", Icon: XCircle,     step: -1 },
};

const DELIVERY_STEPS = [
  { key: "en_attente",     label: "Reçue",            icon: ShoppingBag },
  { key: "validee",        label: "Confirmée",         icon: CheckCircle },
  { key: "en_preparation", label: "Préparation",       icon: Package },
  { key: "en_livraison",   label: "En livraison",      icon: Truck },
  { key: "livree",         label: "Livrée",            icon: CheckCircle },
];
const PICKUP_STEPS = [
  { key: "en_attente",   label: "Reçue",              icon: ShoppingBag },
  { key: "validee",      label: "Confirmée",           icon: CheckCircle },
  { key: "pret_retrait", label: "Prête à récupérer",  icon: Package },
];

const MOYEN_LABEL = {
  cash: "Espèces (Cash)",
  mvola: "Mvola",
  holam: "Holam",
  carte: "Carte bancaire",
};

const FILTERS = [
  { key: "all",           label: "Toutes les commandes", icon: ShoppingBag },
  { key: "en_attente",    label: "En attente",            icon: Clock },
  { key: "validee",       label: "Confirmées",            icon: CheckCircle },
  { key: "en_preparation",label: "En préparation",        icon: Package },
  { key: "en_livraison",  label: "En livraison",          icon: Truck },
  { key: "livree",        label: "Livrées",               icon: CheckCircle },
  { key: "annulee",       label: "Annulées",              icon: XCircle },
];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get(`/store/${SLUG}/orders/mine`)
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
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

  // ─── DETAIL VIEW ───────────────────────────────────────────────────────────
  if (selected) {
    const o = selected;
    const cfg = STATUT_CONFIG[o.statut] || STATUT_CONFIG["en_attente"];
    const isDelivery = o.modeLivraison === "domicile";
    const steps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;
    const currentStep = cfg.step;

    return (
      <div style={{ minHeight: "calc(100vh - 70px)", display: "grid", gridTemplateColumns: "1fr 380px", background: "var(--paper)" }}>

        {/* ── MAIN DETAIL ── */}
        <div style={{ overflowY: "auto", padding: "32px 40px 60px", borderRight: "1px solid var(--line)" }}>
          <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 13, fontWeight: 600, padding: "0 0 24px", marginBottom: 8 }}>
            <ArrowLeft size={15} /> Retour à mes commandes
          </button>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--forest-dark)", margin: "0 0 6px" }}>Commande #{o.id}</h1>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Passée le {new Date(o.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
            </div>
            <span style={{ background: cfg.bg, color: cfg.color, padding: "8px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {cfg.label}
            </span>
          </div>

          {/* SUIVI TIMELINE */}
          {o.statut !== "annulee" && (
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: "28px 32px", marginBottom: 24, boxShadow: "0 2px 12px rgba(34,75,53,0.05)" }}>
              <h3 style={{ margin: "0 0 28px", fontSize: 16, color: "var(--forest-dark)", fontWeight: 700 }}>
                {isDelivery ? "Suivi de votre livraison" : "Suivi — Retrait en boutique"}
              </h3>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                {steps.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      {i > 0 && <div style={{ position: "absolute", left: 0, top: 21, width: "50%", height: 3, background: i <= currentStep ? "var(--forest)" : "var(--line)" }} />}
                      {i < steps.length - 1 && <div style={{ position: "absolute", right: 0, top: 21, width: "50%", height: 3, background: i < currentStep ? "var(--forest)" : "var(--line)" }} />}
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", zIndex: 1,
                        background: done ? "var(--forest)" : "#fff",
                        border: `3px solid ${done ? "var(--forest)" : "var(--line)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: active ? "0 0 0 6px rgba(34,75,53,0.1)" : "none",
                        transition: "all 0.3s"
                      }}>
                        <step.icon size={18} color={done ? "#fff" : "#ccc"} />
                      </div>
                      <div style={{ textAlign: "center", marginTop: 12, padding: "0 4px" }}>
                        <div style={{ fontSize: 12, fontWeight: done ? 700 : 500, color: done ? "var(--forest-dark)" : "var(--muted)" }}>{step.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 28, background: "var(--forest-light)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                <cfg.Icon size={18} color="var(--forest)" />
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--forest-dark)" }}>
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
            <div style={{ background: "#FDF2F0", border: "1px solid #F8D7D2", borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", gap: 14 }}>
              <XCircle size={28} color="#B4483A" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#B4483A", fontSize: 15, marginBottom: 4 }}>Commande annulée</div>
                <div style={{ fontSize: 13, color: "#B4483A", opacity: 0.8 }}>Cette commande a été annulée et ne sera pas traitée.</div>
              </div>
            </div>
          )}

          {/* INFOS LIVRAISON + PAIEMENT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              {
                label: "Mode de livraison",
                content: isDelivery ? "Livraison à domicile" : "Retrait en boutique",
                sub: o.adresseLivraison,
                Icon: isDelivery ? Truck : Package,
              },
              {
                label: "Moyen de paiement",
                content: MOYEN_LABEL[o.moyenPaiement] || o.moyenPaiement,
                sub: null,
                Icon: CreditCard,
              },
            ].map((info, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{info.label}</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--forest-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <info.Icon size={18} color="var(--forest)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{info.content}</div>
                    {info.sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, display: "flex", gap: 4 }}><MapPin size={12} style={{ flexShrink: 0, marginTop: 1 }} />{info.sub}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ARTICLES */}
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--forest-dark)" }}>Articles commandés</span>
            </div>
            {o.items?.map((it, idx) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: idx < o.items.length - 1 ? "1px solid var(--line)" : "none" }}>
                <img src={it.product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=80&q=80"} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{it.product?.nom}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{fcfa(it.prixUnitaire)} / unité · ×{it.quantite}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--forest-dark)" }}>{fcfa(it.prixUnitaire * it.quantite)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: FINANCIAL SUMMARY ── */}
        <div style={{ background: "#fff", display: "flex", flexDirection: "column", padding: "32px 28px", borderLeft: "1px solid var(--line)" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--forest-dark)", margin: "0 0 24px" }}>Résumé financier</h2>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
            <span style={{ color: "var(--muted)" }}>Sous-total</span><span style={{ fontWeight: 600 }}>{fcfa(o.sousTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 14 }}>
            <span style={{ color: "var(--muted)" }}>Frais de livraison</span>
            <span style={{ fontWeight: 600, color: o.fraisLivraison === 0 ? "#2D8653" : "var(--ink)" }}>{o.fraisLivraison === 0 ? "Gratuits" : fcfa(o.fraisLivraison)}</span>
          </div>
          <div style={{ background: "var(--forest-dark)", borderRadius: 16, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#DDE8DF", fontWeight: 600 }}>Total payé</span>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>{fcfa(o.total)}</span>
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
    <div style={{ minHeight: "calc(100vh - 70px)", display: "grid", gridTemplateColumns: "260px 1fr", background: "var(--paper)" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ background: "#fff", borderRight: "1px solid var(--line)", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: 12 }}>
          Filtrer par statut
        </div>
        {FILTERS.map(f => {
          const count = f.key === "all" ? orders.length : orders.filter(o => o.statut === f.key).length;
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
              background: active ? "var(--forest-light)" : "transparent",
              border: active ? "1.5px solid rgba(34,75,53,0.2)" : "1.5px solid transparent",
              color: active ? "var(--forest-dark)" : "var(--muted)",
              fontWeight: active ? 700 : 500, fontSize: 14, cursor: "pointer", width: "100%", textAlign: "left",
              transition: "all 0.15s"
            }}>
              <f.icon size={16} />
              <span style={{ flex: 1 }}>{f.label}</span>
              <span style={{ background: active ? "var(--forest)" : "var(--line)", color: active ? "#fff" : "var(--muted)", borderRadius: 20, padding: "1px 8px", fontSize: 12, fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ overflowY: "auto", padding: "32px 36px 60px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--forest-dark)", margin: "0 0 6px" }}>Mes commandes</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>Suivez l'état de toutes vos commandes en temps réel.</p>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total",      value: stats.total,    color: "var(--forest)", bg: "var(--forest-light)", Icon: ShoppingBag },
            { label: "En cours",   value: stats.enCours,  color: "#D97724",       bg: "#FDF4EB",             Icon: Clock },
            { label: "Livrées",    value: stats.livrees,  color: "#2B6CB0",       bg: "#EBF4FF",             Icon: CheckCircle },
            { label: "Annulées",   value: stats.annulees, color: "#B4483A",       bg: "#FDF2F0",             Icon: XCircle },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <kpi.Icon size={20} color={kpi.color} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>{kpi.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input className="bs-input" style={{ paddingLeft: 42, borderRadius: 12, fontSize: 14, background: "#fff" }}
            placeholder="Rechercher une commande par numéro ou nom de produit..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* LIST */}
        {filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", color: "var(--muted)", textAlign: "center" }}>
            <PackageOpen size={56} strokeWidth={1.2} style={{ marginBottom: 16, opacity: 0.4 }} />
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, color: "var(--ink)" }}>Aucune commande trouvée</div>
            <div style={{ fontSize: 13 }}>Essayez d'autres critères de recherche ou un autre filtre.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(o => {
              const cfg = STATUT_CONFIG[o.statut] || STATUT_CONFIG["en_attente"];
              const isDelivery = o.modeLivraison === "domicile";
              return (
                <div key={o.id} onClick={() => setSelected(o)}
                  style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 22px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", gap: 16, alignItems: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(34,75,53,0.1)"; e.currentTarget.style.borderColor = "rgba(34,75,53,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "var(--line)"; }}
                >
                  {/* Product thumbnails */}
                  <div style={{ display: "flex", flexShrink: 0 }}>
                    {o.items?.slice(0, 3).map((it, idx) => (
                      <img key={it.id} src={it.product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=60&q=80"} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: "2.5px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginLeft: idx > 0 ? -14 : 0, zIndex: 3 - idx }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>Commande #{o.id}</span>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                      {new Date(o.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })} · {isDelivery ? "Livraison à domicile" : "Retrait boutique"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.items?.map(it => `${it.product?.nom} ×${it.quantite}`).join(" · ")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "var(--forest-dark)" }}>{fcfa(o.total)}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{o.items?.length} article{o.items?.length > 1 ? "s" : ""}</div>
                  </div>
                  <ChevronRight size={20} color="var(--muted)" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
