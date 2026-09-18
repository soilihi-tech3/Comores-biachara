import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, ShoppingBag, ArrowRight, Package, Truck } from "lucide-react";
import api, { SLUG } from "../../api";

const fcfa = (n) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";

export default function Confirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/store/${SLUG}/orders/mine`).then(res => {
      const found = res.data.find(o => String(o.id) === String(id));
      setOrder(found || null);
    }).catch(() => {});
  }, [id]);

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px 60px", textAlign: "center" }}>
      {/* SUCCESS ICON */}
      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        background: "linear-gradient(135deg, var(--forest), #3D8C5D)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
        boxShadow: "0 8px 24px rgba(34,75,53,0.25)",
        animation: "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      }}>
        <CheckCircle size={44} color="#fff" strokeWidth={2.5} />
      </div>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--forest-dark)", margin: "0 0 10px" }}>
        Commande confirmée !
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
        Votre commande <strong style={{ color: "var(--ink)" }}>#{id}</strong> a bien été enregistrée.<br />
        Vous serez notifié à chaque étape de la préparation et de la livraison.
      </p>

      {/* ORDER SUMMARY */}
      {order && (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow-md)", textAlign: "left" }}>
          <div style={{ padding: "16px 20px", background: "var(--paper)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
            <ShoppingBag size={16} color="var(--forest)" />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--forest-dark)" }}>Récapitulatif de la commande</span>
          </div>

          {order.items?.map(it => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--line)" }}>
              <img src={it.product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=80&q=80"} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", border: "1px solid var(--line)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{it.product?.nom}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>× {it.quantite} · {fcfa(it.prixUnitaire)} / unité</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{fcfa(it.prixUnitaire * it.quantite)}</div>
            </div>
          ))}

          <div style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Sous-total</span>
              <span style={{ fontWeight: 600 }}>{fcfa(order.sousTotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Livraison</span>
              <span style={{ fontWeight: 600, color: order.fraisLivraison === 0 ? "var(--forest)" : "var(--ink)" }}>
                {order.fraisLivraison === 0 ? "Gratuite" : fcfa(order.fraisLivraison)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "var(--forest-light)", borderRadius: 10, padding: "12px 14px" }}>
              <span style={{ fontWeight: 700, color: "var(--forest-dark)" }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: "var(--forest-dark)" }}>{fcfa(order.total)}</span>
            </div>
          </div>

          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, background: "var(--paper)" }}>
            {order.modeLivraison === "domicile" ? <Truck size={16} color="var(--forest)" /> : <Package size={16} color="var(--forest)" />}
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              {order.modeLivraison === "domicile"
                ? `Livraison à : ${order.adresseLivraison || "Adresse non spécifiée"}`
                : "Retrait en boutique"}
            </span>
          </div>
        </div>
      )}

      {/* NEXT STEP */}
      <div style={{ background: "var(--forest-light)", borderRadius: 16, padding: "18px 20px", marginBottom: 24, textAlign: "left", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <CheckCircle size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--forest-dark)", marginBottom: 4 }}>Prochaine étape</div>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            Votre commande est en cours de traitement. Vous pouvez suivre son évolution en temps réel depuis la page "Mes commandes".
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => navigate("/catalogue")} style={{ flex: 1, padding: "12px 20px", borderRadius: 14, border: "1.5px solid var(--line)", background: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>
          Continuer mes achats
        </button>
        <button className="bs-btn-primary" style={{ flex: 1, padding: "12px 20px", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => navigate("/mes-commandes")}>
          Suivre ma commande <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
