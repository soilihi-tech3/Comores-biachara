import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Store, Facebook, Instagram, MessageCircle, Info, Package, Grid, Home as HomeIcon, Clock } from "lucide-react";
import api, { SLUG } from "../api";

import { useAuth } from "../context/AuthContext.jsx";

export default function Footer() {
  const { boutique: boutiqueContext } = useAuth();
  const [boutiqueLocal, setBoutiqueLocal] = useState(null);
  const [categories, setCategories] = useState([]);

  const boutique = boutiqueContext || boutiqueLocal;

  useEffect(() => {
    if (!boutiqueContext) {
      api.get(`/store/${SLUG}`).then(res => setBoutiqueLocal(res.data)).catch(() => {});
    }
    api.get(`/store/${SLUG}/categories`).then(res => setCategories(res.data || [])).catch(() => {});
  }, [boutiqueContext]);

  const rawWaNum = boutique?.whatsappNumber || boutique?.telephone || "";
  const cleanWaNum = rawWaNum.replace(/[^0-9]/g, "");
  const whatsappUrl = cleanWaNum ? `https://wa.me/${cleanWaNum}?text=${encodeURIComponent("Bonjour ! Je souhaite avoir des informations sur vos produits.")}` : null;
  const facebookUrl = boutique?.facebookUrl || "https://facebook.com";
  const instagramUrl = boutique?.instagramUrl || "https://instagram.com";
  const tiktokUrl = boutique?.tiktokUrl || "https://tiktok.com";
  const horaires = boutique?.horairesOuverture || "Tous les jours de 08h30 à 23h00";

  return (
    <footer style={{ background: "var(--forest-dark)", color: "#F0F3EC", padding: "60px 24px 24px", marginTop: "auto" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 40, marginBottom: 40 }}>
        
        {/* COLONNE 1: À PROPOS & LOGO */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            {boutique?.logoUrl ? (
              <img src={boutique.logoUrl} alt={boutique.nom} style={{ height: 38, borderRadius: 6, objectFit: "contain", background: "#fff", padding: 3 }} />
            ) : (
              <Store size={26} color="#A8BEB1" />
            )}
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{boutique?.nom || ""}</span>
          </div>
          <p style={{ color: "#A8BEB1", lineHeight: 1.6, fontSize: 13.5, margin: "0 0 20px 0" }}>
            {boutique?.aProposText || "Bienvenue dans notre boutique en ligne. Découvrez des produits frais, bio et naturels sélectionnés avec soin pour votre santé et votre bien-être."}
          </p>

          {/* RÉSEAUX SOCIAUX */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <a href={facebookUrl} target="_blank" rel="noreferrer" title="Facebook" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#1877F2"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
              <Facebook size={18} />
            </a>
            <a href={instagramUrl} target="_blank" rel="noreferrer" title="Instagram" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#E4405F"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
              <Instagram size={18} />
            </a>
            <a href={tiktokUrl} target="_blank" rel="noreferrer" title="TikTok" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#000000"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.42V8.9a6.34 6.34 0 0 0-5.46 6.31 6.34 6.34 0 1 0 11.8-3.41V9.5a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.0-0.93z"/>
              </svg>
            </a>
          </div>

          {/* BOUTON WHATSAPP */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#25D366",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: 25,
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
                transition: "transform 0.15s, background 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1.0)"; }}
            >
              <MessageCircle size={18} fill="#ffffff" color="#25D366" /> Nous contacter sur WhatsApp
            </a>
          )}
        </div>

        {/* COLONNE 2: NAVIGATION */}
        <div>
          <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18, color: "#fff", fontWeight: 800 }}>Navigation</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <li><Link to="/" style={{ color: "#A8BEB1", textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><HomeIcon size={15} /> Accueil</Link></li>
            <li><Link to="/catalogue" style={{ color: "#A8BEB1", textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Grid size={15} /> Tous nos produits</Link></li>
            <li><Link to="/a-propos" style={{ color: "#A8BEB1", textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Info size={15} /> À propos de nous</Link></li>
            <li><Link to="/mes-commandes" style={{ color: "#A8BEB1", textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Package size={15} /> Suivi de mes commandes</Link></li>
          </ul>
        </div>

        {/* COLONNE 3: NOS BOUTIQUES & HORAIRES */}
        <div>
          <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18, color: "#fff", fontWeight: 800 }}>Boutiques & Horaires</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#A8BEB1", fontSize: 13.5 }}>
              <Clock size={18} style={{ color: "#A7F3D0", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>Horaires d'ouverture :</div>
                <div>{horaires}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#A8BEB1", fontSize: 13.5 }}>
              <MapPin size={18} style={{ color: "#A7F3D0", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>Adresse principale :</div>
                <div>{boutique?.adresse || "Adresse non renseignée"}</div>
              </div>
            </div>

            {boutique?.adresse2 && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#A8BEB1", fontSize: 13.5 }}>
                <MapPin size={18} style={{ color: "#A7F3D0", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>Seconde adresse :</div>
                  <div>{boutique.adresse2}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE 4: NOUS CONTACTER (TÉLÉPHONES & EMAIL) */}
        <div>
          <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18, color: "#fff", fontWeight: 800 }}>Nous Contacter</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#A8BEB1", fontSize: 13.5 }}>
              <Phone size={18} style={{ color: "#A7F3D0", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>Tél 1 : {boutique?.telephone || "+33 1 23 45 67 89"}</div>
                {boutique?.telephone2 && (
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, marginTop: 4 }}>Tél 2 : {boutique.telephone2}</div>
                )}
              </div>
            </li>
            {boutique?.emailContact && (
              <li style={{ display: "flex", alignItems: "center", gap: 10, color: "#A8BEB1", fontSize: 13.5 }}>
                <Mail size={18} style={{ color: "#A7F3D0", flexShrink: 0 }} />
                <span>{boutique.emailContact}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* GALERIE / CHIPS DE CATÉGORIES POPULAIRES */}
      {categories.length > 0 && (
        <div style={{ maxWidth: 1280, margin: "0 auto 30px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#7B9686", fontWeight: 800, marginBottom: 12 }}>
            Nos Catégories Populaires :
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalogue?categoryId=${cat.id}`}
                style={{
                  background: "rgba(255,255,255,0.06)", color: "#A8BEB1", padding: "6px 14px",
                  borderRadius: 20, fontSize: 12.5, fontWeight: 600, textDecoration: "none",
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--forest)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#A8BEB1"; }}
              >
                {cat.nom}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM BAR */}
      <div style={{ maxWidth: 1280, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", color: "#7B9686", fontSize: 13, gap: 12 }}>
        <div>© 2026 {boutique?.nom || "Marché Vert"}. Tous droits réservés.</div>
        <div style={{ display: "flex", gap: 20 }}>
          <span>Qualité & Fraîcheur Garanties</span>
        </div>
      </div>
    </footer>
  );
}
