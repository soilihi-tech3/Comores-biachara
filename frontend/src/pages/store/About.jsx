import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, ShieldCheck, Truck, Leaf, Phone, MapPin, Mail, ArrowRight, Award } from "lucide-react";
import api, { SLUG } from "../../api";

export default function About() {
  const [boutique, setBoutique] = useState(null);

  useEffect(() => {
    api.get(`/store/${SLUG}`).then(res => setBoutique(res.data)).catch(() => {});
  }, []);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* BANNIÈRE HÉRO À PROPOS */}
      <div className="bs-about-hero" style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        minHeight: 240,
        margin: "16px 0 32px",
        backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        padding: "32px 16px"
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(16,42,28,0.75), rgba(16,42,28,0.9))" }}></div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 700 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12
          }}>
            <Leaf size={15} color="#A7F3D0" /> Notre Histoire & Engagement
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
            À propos de {boutique?.nom || "Marché Vert"}
          </h1>
          <p style={{ fontSize: "clamp(13.5px, 3.5vw, 16px)", marginTop: 10, opacity: 0.95, lineHeight: 1.6 }}>
            Votre partenaire de confiance pour des produits frais, locaux, et naturels livrés directement chez vous.
          </p>
        </div>
      </div>

      {/* BLOC PRÉSENTATION ET VALEURS */}
      <div className="bs-about-grid" style={{ marginBottom: 40 }}>
        <div>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, color: "var(--forest-dark)", marginBottom: 14 }}>
            Qui sommes-nous ?
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "var(--ink)", marginBottom: 20 }}>
            {boutique?.aProposText || 
              "Bienvenue dans notre boutique en ligne. Nous sommes passionnés par la fraîcheur, la qualité supérieure et l'authenticité de nos produits. Sélectionnés rigoureusement auprès de producteurs engagés, nous apportons le meilleur des légumes bio, des fruits de saison, de l'épicerie fine et des soins cosmétiques naturels directement sur votre table."
            }
          </p>
          
          <div className="bs-about-cards-grid" style={{ marginTop: 20 }}>
            <div style={{ background: "var(--paper)", padding: 18, borderRadius: 14, border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--forest-dark)", fontWeight: 800, marginBottom: 6, fontSize: 14 }}>
                <ShieldCheck size={18} color="var(--forest)" /> 100% Qualité Garantie
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                Articles contrôlés et certifiés pour une fraîcheur irréprochable.
              </p>
            </div>

            <div style={{ background: "var(--paper)", padding: 18, borderRadius: 14, border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--forest-dark)", fontWeight: 800, marginBottom: 6, fontSize: 14 }}>
                <Truck size={18} color="var(--forest)" /> Livraison Rapide
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                Livraison express directement à domicile ou en point de retrait.
              </p>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 12 }}>
          <img 
            src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80" 
            alt="Produits bio" 
            style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 18, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
          />
          <div style={{
            position: "absolute", bottom: -14, left: 14, right: 14,
            background: "#fff", padding: "12px 16px", borderRadius: 14,
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)", border: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 12
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--forest-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Award size={20} color="var(--forest-dark)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--forest-dark)" }}>Direct Producteurs</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Produits de saison & éco-responsables</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION ADRESSES & CONTACTS */}
      <div style={{ background: "var(--paper)", padding: "24px 16px", borderRadius: 18, border: "1px solid var(--line)", marginTop: 24 }}>
        <h3 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: "var(--forest-dark)", marginTop: 0, marginBottom: 20, textAlign: "center" }}>
          Nos Coordonnées & Boutiques
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {/* NOS BOUTIQUES */}
          <div style={{ background: "#fff", padding: 18, borderRadius: 14, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--forest)", fontWeight: 800, fontSize: 14.5, marginBottom: 10 }}>
              <MapPin size={18} /> Nos Adresses & Boutiques
            </div>
            <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color="var(--forest)" style={{ flexShrink: 0 }} /> {boutique?.adresse || "Adresse principale non renseignée"}
            </div>
            {boutique?.adresse2 && (
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={14} color="var(--forest)" style={{ flexShrink: 0 }} /> {boutique.adresse2}
              </div>
            )}
          </div>

          {/* NOUS CONTACTER */}
          <div style={{ background: "#fff", padding: 18, borderRadius: 14, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--forest)", fontWeight: 800, fontSize: 14.5, marginBottom: 10 }}>
              <Phone size={18} /> Téléphones & Assistance
            </div>
            <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
              📞 {boutique?.telephone || "+33 1 23 45 67 89"}
            </div>
            {boutique?.telephone2 && (
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600, marginTop: 6 }}>
                📞 {boutique.telephone2}
              </div>
            )}
          </div>

          {/* EMAIL */}
          <div style={{ background: "#fff", padding: 18, borderRadius: 14, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--forest)", fontWeight: 800, fontSize: 14.5, marginBottom: 10 }}>
              <Mail size={18} /> Contact Email
            </div>
            <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600, wordBreak: "break-word" }}>
              ✉️ {boutique?.emailContact || "contact@marchevert.com"}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/catalogue">
            <button className="bs-btn-primary" style={{ padding: "12px 24px", fontSize: 13.5, borderRadius: 24, width: "100%", maxWidth: 300 }}>
              Découvrir nos produits <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
