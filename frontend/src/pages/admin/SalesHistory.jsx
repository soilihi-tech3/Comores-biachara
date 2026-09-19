import React, { useEffect, useState } from "react";
import { 
  Search, FileText, Download, Printer, Eye, Calendar, DollarSign, 
  CreditCard, Smartphone, CheckCircle, User, ShoppingBag, History, X, Building
} from "lucide-react";
import api from "../../api";
import TablePagination from "../../components/TablePagination.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { subscribeRealtime } from "../../utils/realtime.js";

const fcfa = (n) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" }
];

export default function SalesHistory() {
  const { user, boutique } = useAuth();
  const storeName = boutique?.nom || "Marché Vert";
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("tous"); // "tous" | "vente_directe" | "commande_enligne"
  const [filterPaiement, setFilterPaiement] = useState("tous"); // "tous" | "cash" | "orange_money" | "wave" | "carte"
  const [filterEmploye, setFilterEmploye] = useState("tous");
  const [filterAnnee, setFilterAnnee] = useState(new Date().getFullYear().toString());
  const [filterMois, setFilterMois] = useState("");
  const [isTodayOnly, setIsTodayOnly] = useState(false);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  function loadData() {
    setLoading(true);
    api.get("/admin/orders")
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));

    api.get("/admin/employees")
      .then((res) => setEmployees(res.data || []))
      .catch(() => setEmployees([]));
  }

  useEffect(() => {
    loadData();
    const unsub = subscribeRealtime((detail) => {
      if (detail.type === "order_created" || detail.type === "order_updated") {
        loadData();
      }
    });
    return unsub;
  }, []);

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    // Type detection (backward compatibility)
    const isPOS = o.typeVente === "vente_directe" || o.adresseLivraison?.includes("Achat direct") || o.modeLivraison === "retrait";
    const saleType = isPOS ? "vente_directe" : "commande_enligne";

    if (filterType !== "tous" && saleType !== filterType) return false;

    // Paiement filter
    if (filterPaiement !== "tous" && o.moyenPaiement !== filterPaiement) return false;

    // Employe filter
    if (filterEmploye !== "tous") {
      if (filterEmploye === "non_assigne") {
        if (o.employeAssigneId) return false;
      } else if (String(o.employeAssigneId) !== String(filterEmploye)) {
        return false;
      }
    }

    // Date filters
    const orderDate = new Date(o.createdAt);
    const orderYear = orderDate.getFullYear().toString();
    const orderMonth = String(orderDate.getMonth() + 1).padStart(2, "0");

    if (isTodayOnly) {
      const today = new Date();
      const isSameDay = orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear();
      if (!isSameDay) return false;
    } else {
      if (filterAnnee && orderYear !== filterAnnee) return false;
      if (filterMois && orderMonth !== filterMois) return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchClient = o.client?.nom?.toLowerCase().includes(q) || o.client?.telephone?.includes(q);
      const matchId = `com-b${String(o.id).padStart(3, "0")}`.includes(q) || String(o.id).includes(q);
      const matchItems = o.items?.some(it => it.product?.nom?.toLowerCase().includes(q));
      if (!matchClient && !matchId && !matchItems) return false;
    }

    return true;
  });

  // Calculate totals for KPI cards
  const totalCash = filteredOrders
    .filter(o => o.moyenPaiement === "cash")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const totalOrange = filteredOrders
    .filter(o => o.moyenPaiement === "orange_money")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const totalWave = filteredOrders
    .filter(o => o.moyenPaiement === "wave")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const totalGlobal = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Reset page
  useEffect(() => { setCurrentPage(1); }, [search, filterType, filterPaiement, filterEmploye, filterAnnee, filterMois, isTodayOnly]);

  const totalItems = filteredOrders.length;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Export CSV
  function handleExportExcel() {
    const headers = ["ID Vente", "Date", "Client", "Téléphone", "Type", "Employé", "Mode Paiement", "Total (€)"];
    const rows = filteredOrders.map(o => {
      const isPOS = o.typeVente === "vente_directe" || o.adresseLivraison?.includes("Achat direct");
      const dateStr = new Date(o.createdAt).toLocaleString("fr-FR");
      const typeStr = isPOS ? "Vente Directe (POS)" : "Commande en Ligne";
      const empStr = o.employeAssigne?.nom || "Admin / Système";
      const payStr = o.moyenPaiement === "cash" ? "Cash / Espèces" : o.moyenPaiement === "orange_money" ? "Orange Money" : o.moyenPaiement === "wave" ? "Wave" : "Carte Bancaire";
      return [
        `#COM-B${String(o.id).padStart(3, "0")}`,
        `"${dateStr}"`,
        `"${o.client?.nom || "Client comptoir"}"`,
        `"${o.client?.telephone || "-"}"`,
        `"${typeStr}"`,
        `"${empStr}"`,
        `"${payStr}"`,
        Number(o.total || 0).toFixed(2)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historique_ventes_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleExportPDF() {
    window.print();
  }

  return (
    <>
      {/* HEADER PAGE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, margin: 0, color: "var(--forest-dark)" }}>Historique des Ventes</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>
            Consultez, filtrez et analysez toutes les ventes directes et commandes en ligne.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleExportPDF}
            className="bs-btn-primary"
            style={{ background: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", fontSize: 13, padding: "8px 16px", boxShadow: "none" }}
          >
            <Printer size={15} style={{ marginRight: 6 }} /> Imprimer / PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="bs-btn-primary"
            style={{ background: "var(--forest-light)", color: "var(--forest-dark)", fontSize: 13, padding: "8px 16px", boxShadow: "none" }}
          >
            <Download size={15} style={{ marginRight: 6 }} /> Export Excel
          </button>
        </div>
      </div>

      {/* FILTER BAR ROW */}
      <div className="bs-panel" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* SEARCH INPUT */}
          <div style={{ position: "relative", flex: 2, minWidth: 220 }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input
              className="bs-input"
              placeholder="Rechercher par client, produit, N° vente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 38, height: 40, fontSize: 13.5 }}
            />
          </div>

          {/* FILTER: TYPE VENTE */}
          <select
            className="bs-select"
            style={{ flex: 1, minWidth: 150, height: 40 }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="tous">Tout type de vente</option>
            <option value="vente_directe">Vente Directe (POS)</option>
            <option value="commande_enligne">Commande en Ligne</option>
          </select>

          {/* FILTER: PAIEMENT */}
          <select
            className="bs-select"
            style={{ flex: 1, minWidth: 150, height: 40 }}
            value={filterPaiement}
            onChange={(e) => setFilterPaiement(e.target.value)}
          >
            <option value="tous">Tous les paiements</option>
            <option value="cash">Espèces / Cash</option>
            <option value="orange_money">Orange Money</option>
            <option value="wave">Wave</option>
            <option value="carte">Carte Bancaire</option>
          </select>

          {/* FILTER: EMPLOYÉ */}
          <select
            className="bs-select"
            style={{ flex: 1, minWidth: 160, height: 40 }}
            value={filterEmploye}
            onChange={(e) => setFilterEmploye(e.target.value)}
          >
            <option value="tous">Tous les employés</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nom} ({emp.role === "admin" ? "Admin" : "Employé"})</option>
            ))}
            <option value="non_assigne">Admin / Système</option>
          </select>

          {/* FILTER: ANNÉE */}
          <select
            className="bs-select"
            style={{ width: 130, height: 40 }}
            value={filterAnnee}
            onChange={(e) => { setFilterAnnee(e.target.value); setIsTodayOnly(false); }}
          >
            <option value="">Toutes années</option>
            <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
          </select>

          {/* FILTER: MOIS */}
          <select
            className="bs-select"
            style={{ width: 130, height: 40 }}
            value={filterMois}
            onChange={(e) => { setFilterMois(e.target.value); setIsTodayOnly(false); }}
          >
            <option value="">Tous les mois</option>
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* QUICK TODAY BUTTON */}
          <button
            onClick={() => setIsTodayOnly(!isTodayOnly)}
            style={{
              height: 40, padding: "0 16px", borderRadius: 8, border: "1px solid var(--line)",
              background: isTodayOnly ? "var(--forest)" : "var(--paper)",
              color: isTodayOnly ? "#fff" : "var(--forest-dark)",
              fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}
          >
            <Calendar size={15} /> Aujourd'hui
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        {/* TOTAL CASH */}
        <div className="bs-panel" style={{ padding: 18, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
            <DollarSign size={16} /> TOTAL CASH
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#15803D", marginTop: 8 }}>
            {fcfa(totalCash)}
          </div>
        </div>

        {/* TOTAL ORANGE MONEY */}
        <div className="bs-panel" style={{ padding: 18, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#92400E", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
            <Smartphone size={16} /> TOTAL ORANGE
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#D97706", marginTop: 8 }}>
            {fcfa(totalOrange)}
          </div>
        </div>

        {/* TOTAL WAVE */}
        <div className="bs-panel" style={{ padding: 18, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1E40AF", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
            <Smartphone size={16} /> TOTAL WAVE
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#2563EB", marginTop: 8 }}>
            {fcfa(totalWave)}
          </div>
        </div>

        {/* TOTAL GLOBAL */}
        <div className="bs-panel" style={{ padding: 18, background: "var(--forest-light)", border: "1px solid #A7F3D0", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--forest-dark)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
            <ShoppingBag size={16} /> TOTAL GLOBAL
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "var(--forest-dark)", marginTop: 8 }}>
            {fcfa(totalGlobal)}
          </div>
        </div>
      </div>

      {/* SALES HISTORY DATA TABLE */}
      <div className="bs-panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="bs-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>CLIENT</th>
              <th>PRODUIT(S)</th>
              <th>TYPE</th>
              <th>EMPLOYÉ</th>
              <th>PAIEMENT</th>
              <th>MONTANT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>
                  Chargement de l'historique des ventes...
                </td>
              </tr>
            )}
            {!loading && paginatedOrders.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                  Aucune vente enregistrée pour les filtres sélectionnés.
                </td>
              </tr>
            )}
            {!loading && paginatedOrders.map((o) => {
              const isPOS = o.typeVente === "vente_directe" || o.adresseLivraison?.includes("Achat direct") || o.modeLivraison === "retrait";
              const dateFormatted = new Date(o.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
              });

              // Format items: Max 2 displayed cleanly without bullet point, then "+ X autres"
              const itemsList = o.items || [];
              const displayItems = itemsList.slice(0, 2);
              const extraCount = itemsList.length - 2;

              return (
                <tr key={o.id}>
                  <td style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>{dateFormatted}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>#COM-B{String(o.id).padStart(3, "0")}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>{o.client?.nom || "Client comptoir"}</div>
                    {o.client?.telephone && o.client.telephone !== "non_renseigne" && (
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Tél: {o.client.telephone}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12.5 }}>
                      {displayItems.map((it, i) => (
                        <div key={i} style={{ color: "var(--ink)", fontWeight: 500 }}>
                          <span style={{ fontWeight: 700 }}>{it.product?.nom || "Produit"}</span>
                          <span style={{ color: "var(--muted)", marginLeft: 4, fontSize: 11.5 }}>x{it.quantite}</span>
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <div style={{ fontSize: 11.5, color: "var(--forest-dark)", fontWeight: 700, marginTop: 2 }}>
                          + {extraCount} autre{extraCount > 1 ? "s" : ""}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {isPOS ? (
                      <span style={{ background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                        Vente Directe (POS)
                      </span>
                    ) : (
                      <span style={{ background: "#DBEAFE", color: "#1E40AF", padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                        Commande en ligne
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    <span style={{ fontWeight: 600, color: "var(--forest-dark)" }}>
                      {o.employeAssigne?.nom || "Admin / Système"}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: "4px 10px", borderRadius: 12, fontSize: 11.5, fontWeight: 800,
                      background: o.moyenPaiement === "cash" ? "#FEF3C7" : o.moyenPaiement === "orange_money" ? "#FFEDD5" : o.moyenPaiement === "wave" ? "#E0F2FE" : "#F3E8FF",
                      color: o.moyenPaiement === "cash" ? "#92400E" : o.moyenPaiement === "orange_money" ? "#C2410C" : o.moyenPaiement === "wave" ? "#0369A1" : "#6B21A8"
                    }}>
                      {o.moyenPaiement === "cash" ? "Cash / Espèces" : o.moyenPaiement === "orange_money" ? "Orange Money" : o.moyenPaiement === "wave" ? "Wave" : "Carte"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: 14, color: "var(--forest-dark)", whiteSpace: "nowrap" }}>
                    {fcfa(o.total)}
                  </td>
                  <td>
                    <button
                      className="bs-icon-btn"
                      title="Voir le reçu / ticket de caisse"
                      onClick={() => setSelectedOrder(o)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PAGINATION */}
        <TablePagination
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* MODAL REÇU / TICKET DE CAISSE AUTHENTIQUE */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(22,52,36,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, padding: 24,
              maxWidth: 420, width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
              fontFamily: "Courier, monospace, sans-serif"
            }}
          >
            {/* TICKET HEADER */}
            <div style={{ textAlign: "center", borderBottom: "1px dashed #64748B", paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: 1 }}>{storeName.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>BOUTIQUE & COMMERCE EN LIGNE</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                REÇU N° #COM-B{String(selectedOrder.id).padStart(3, "0")}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                {new Date(selectedOrder.createdAt).toLocaleString("fr-FR")}
              </div>
            </div>

            {/* METADATA */}
            <div style={{ fontSize: 11.5, color: "#334155", marginBottom: 12, lineHeight: 1.5 }}>
              <div><strong>Client:</strong> {selectedOrder.client?.nom || "Client comptoir"}</div>
              {selectedOrder.client?.telephone && selectedOrder.client.telephone !== "non_renseigne" && (
                <div><strong>Téléphone:</strong> {selectedOrder.client.telephone}</div>
              )}
              <div><strong>Caissier:</strong> {selectedOrder.employeAssigne?.nom || "Admin / Système"}</div>
              <div><strong>Type:</strong> {selectedOrder.typeVente === "vente_directe" ? "Vente Directe POS" : "Commande en Ligne"}</div>
            </div>

            {/* ITEMS TABLE */}
            <div style={{ borderTop: "1px dashed #64748B", borderBottom: "1px dashed #64748B", padding: "10px 0", marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 0.6fr 1fr 1fr", fontSize: 11, fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #E2E8F0", paddingBottom: 4, marginBottom: 6 }}>
                <span>ARTICLE</span>
                <span style={{ textAlign: "center" }}>QTÉ</span>
                <span style={{ textAlign: "right" }}>PRIX U.</span>
                <span style={{ textAlign: "right" }}>TOTAL</span>
              </div>

              {selectedOrder.items?.map((it, idx) => {
                const pu = Number(it.prixUnitaire || it.product?.prix || 0);
                const totLine = pu * it.quantite;

                return (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "2.2fr 0.6fr 1fr 1fr", fontSize: 11.5, color: "#1E293B", marginBottom: 5 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.product?.nom || "Produit"}
                    </span>
                    <span style={{ textAlign: "center" }}>{it.quantite}</span>
                    <span style={{ textAlign: "right" }}>{pu.toFixed(2)} €</span>
                    <span style={{ textAlign: "right", fontWeight: 700 }}>{totLine.toFixed(2)} €</span>
                  </div>
                );
              })}
            </div>

            {/* TOTALS SUMMARY */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#1E293B", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Sous-Total:</span>
                <span>{fcfa(selectedOrder.sousTotal || selectedOrder.total)}</span>
              </div>
              {Number(selectedOrder.fraisLivraison || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Frais de livraison:</span>
                  <span>{fcfa(selectedOrder.fraisLivraison)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, color: "#0F172A", borderTop: "1px dashed #64748B", paddingTop: 8, marginTop: 4 }}>
                <span>TOTAL RÉGLÉ:</span>
                <span>{fcfa(selectedOrder.total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginTop: 2 }}>
                <span>Paiement:</span>
                <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{selectedOrder.moyenPaiement?.replace("_", " ")}</span>
              </div>
            </div>

            {/* FOOTER MESSAGE */}
            <div style={{ textAlign: "center", fontSize: 11, color: "#64748B", borderTop: "1px dashed #64748B", paddingTop: 10, marginBottom: 16 }}>
              Merci pour votre confiance !<br />À très bientôt chez {storeName}.
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, padding: "10px", borderRadius: 8, background: "var(--forest)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "sans-serif" }}
              >
                <Printer size={16} /> Imprimer Reçu
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155", fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
