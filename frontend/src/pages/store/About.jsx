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
      <div style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        height: 320,
        margin: "20px 0 40px",
        backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)"
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(16,42,28,0.7), rgba(16,42,28,0.85))" }}></div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 700, padding: "0 20px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 16
          }}>
            <Leaf size={16} color="#A7F3D0" /> Notre Histoire & Notre Engagement
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
            À propos de {boutique?.nom || "Marché Vert"}
          </h1>
          <p style={{ fontSize: 16, marginTop: 12, opacity: 0.9, lineHeight: 1.6 }}>
            Votre partenaire de confiance pour des produits frais, locaux, et naturels livrés directement chez vous.
          </p>
        </div>
      </div>

      {/* BLOC PRÉSENTATION ET VALEURS */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 40, marginBottom: 50, alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--forest-dark)", marginBottom: 16 }}>
            Qui sommes-nous ?
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--ink)", marginBottom: 20 }}>
            {boutique?.aProposText || 
              "Bienvenue dans notre boutique en ligne. Nous sommes passionnés par la fraîcheur, la qualité supérieure et l'authenticité de nos produits. Sélectionnés rigoureusement auprès de producteurs engagés, nous apportons le meilleur des légumes bio, des fruits de saison, de l'épicerie fine et des soins cosmétiques naturels directement sur votre table."
            }
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
            <div style={{ background: "var(--paper)", padding: 20, borderRadius: 14, border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--forest-dark)", fontWeight: 800, marginBottom: 8 }}>
                <ShieldCheck size={20} color="var(--forest)" /> 100% Qualité Garantie
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                Articles contrôlés et certifiés pour une fraîcheur irréprochable.
              </p>
            </div>

            <div style={{ background: "var(--paper)", padding: 20, borderRadius: 14, border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--forest-dark)", fontWeight: 800, marginBottom: 8 }}>
                <Truck size={20} color="var(--forest)" /> Livraison Rapide
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                Livraison express directement à domicile ou en point de retrait.
              </p>
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <img 
            src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80" 
            alt="Produits bio" 
            style={{ width: "100%", height: 380, objectFit: "cover", borderRadius: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
          />
          <div style={{
            position: "absolute", bottom: -20, left: -20,
            background: "#fff", padding: "16px 20px", borderRadius: 16,
            boxShadow: "0 8px 25px rgba(0,0,0,0.12)", border: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 14
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--forest-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={24} color="var(--forest-dark)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--forest-dark)" }}>Direct Producteurs</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Des produits de saison & éco-responsables</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION ADRESSES & CONTACTS */}
      <div style={{ background: "var(--paper)", padding: 36, borderRadius: 20, border: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--forest-dark)", marginTop: 0, marginBottom: 24, textAlign: "center" }}>
          Nos Coordonnées & Adresses de nos Boutiques
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {/* NOS BOUTIQUES */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--forest)", fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
              <MapPin size={20} /> Nos Adresses & Boutiques
            </div>
            <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={15} color="var(--forest)" /> {boutique?.adresse || "Adresse principale non renseignée"}
            </div>
            {boutique?.adresse2 && (
              <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={15} color="var(--forest)" /> {boutique.adresse2}
              </div>
            )}
          </div>

          {/* NOUS CONTACTER */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--forest)", fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
              <Phone size={20} /> Téléphones & Assistance
            </div>
            <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>
              📞 {boutique?.telephone || "+33 1 23 45 67 89"}
            </div>
            {boutique?.telephone2 && (
              <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600, marginTop: 8 }}>
                📞 {boutique.telephone2}
              </div>
            )}
          </div>

          {/* EMAIL */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--forest)", fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
              <Mail size={20} /> Contact Email
            </div>
            <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>
              ✉️ {boutique?.emailContact || "contact@marchevert.com"}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Link to="/catalogue">
            <button className="bs-btn-primary" style={{ padding: "12px 28px", fontSize: 14, borderRadius: 24 }}>
              Découvrir nos produits <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
