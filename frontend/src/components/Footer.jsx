import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Store, Facebook, Instagram, MessageCircle, Info, Package, Grid, Home as HomeIcon, Clock, ShieldCheck, Truck, CheckCircle, Headphones } from "lucide-react";
import api, { SLUG } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { MvolaLogo, WeroLogo, VisaLogo, MastercardLogo, PaypalLogo, VirementLogo } from "./PaymentLogos";

export default function Footer() {
  const { boutique: boutiqueContext } = useAuth();
  const [boutiqueLocal, setBoutiqueLocal] = useState(null);

  const boutique = boutiqueContext || boutiqueLocal;

  useEffect(() => {
    if (!boutiqueContext) {
      api.get(`/store/${SLUG}`).then(res => setBoutiqueLocal(res.data)).catch(() => { });
    }
  }, [boutiqueContext]);

  const rawWaNum = boutique?.whatsappNumber || boutique?.telephone || "";
  const cleanWaNum = rawWaNum.replace(/[^0-9]/g, "");
  const whatsappUrl = cleanWaNum
    ? `https://wa.me/${cleanWaNum}?text=${encodeURIComponent("Bonjour ! Je souhaite avoir des informations sur vos produits.")}`
    : "https://wa.me/+33774854318";

  const facebookUrl = boutique?.facebookUrl || "https://facebook.com";
  const instagramUrl = boutique?.instagramUrl || "https://instagram.com";
  const tiktokUrl = boutique?.tiktokUrl || "https://tiktok.com";
  const horaires = boutique?.horairesOuverture || "Tous les jours de 08h30 à 23h00";

  return (
    <>
      {/* ── BANNIÈRE DE CONFIANCE HORIZONTALE COMPACTE (SLIM) ── */}
      <div style={{
        background: "var(--paper)",
        borderTop: "1px solid var(--line)",
        padding: "16px 20px"
      }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12
        }}>
          {/* CARTE 1: PAIEMENT SÉCURISÉ */}
          <div style={{
            background: "var(--card)",
            borderRadius: 12,
            padding: "12px 14px",
            textAlign: "center",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 1px 6px rgba(0,0,0,0.02)"
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#E8F0FE", color: "#1A73E8",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.2 }}>
                Paiement sécurisé
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.3, marginTop: 2 }}>
                Livraison ou en ligne avec reçu
              </div>
            </div>
          </div>

          {/* CARTE 2: COMMANDE SUIVIE */}
          <div style={{
            background: "var(--card)",
            borderRadius: 12,
            padding: "12px 14px",
            textAlign: "center",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 1px 6px rgba(0,0,0,0.02)"
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#EBF7F0", color: "var(--forest)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              <Truck size={20} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.2 }}>
                Commande suivie
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.3, marginTop: 2 }}>
                Notification à chaque étape
              </div>
            </div>
          </div>

          {/* CARTE 3: PRODUITS VÉRIFIÉS AUTHENTIQUES */}
          <div style={{
            background: "var(--card)",
            borderRadius: 12,
            padding: "12px 14px",
            textAlign: "center",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 1px 6px rgba(0,0,0,0.02)"
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#FFF4EB", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              <CheckCircle size={20} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.2 }}>
                Produits authentiques
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.3, marginTop: 2 }}>
                Certifiés et contrôlés avec soin
              </div>
            </div>
          </div>

          {/* CARTE 4: SUPPORT 24H / 7J */}
          <div style={{
            background: "var(--card)",
            borderRadius: 12,
            padding: "12px 14px",
            textAlign: "center",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 1px 6px rgba(0,0,0,0.02)"
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#F3E8FF", color: "#7E22CE",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              <Headphones size={20} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.2 }}>
                Support 24h / 7j
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.3, marginTop: 2 }}>
                Service client réactif à votre écoute
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER SLIM & ÉLÉGANT ── */}
      <footer style={{ background: "var(--forest-dark)", color: "#F0F3EC", padding: "32px 24px 18px", marginTop: "auto" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, marginBottom: 24 }}>

          {/* COLONNE 1: BOUTIQUE & À PROPOS (ÉPURÉ SANS BOUTON ENCOMBRANT) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              {boutique?.logoUrl ? (
                <img src={boutique.logoUrl} alt={boutique.nom} style={{ height: 32, borderRadius: 6, objectFit: "contain", background: "#fff", padding: 2 }} />
              ) : (
                <Store size={22} color="#A8BEB1" />
              )}
              <span style={{ fontSize: 19, fontWeight: 800, color: "#fff" }}>{boutique?.nom || ""}</span>
            </div>
            <p style={{ color: "#A8BEB1", lineHeight: 1.55, fontSize: 13, margin: 0 }}>
              {boutique?.aProposText || "Bienvenue dans notre boutique en ligne. Découvrez des produits frais, bio et naturels sélectionnés avec soin pour votre santé et votre bien-être."}
            </p>
          </div>

          {/* COLONNE 2: NAVIGATION */}
          <div>
            <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, color: "#fff", fontWeight: 800 }}>Navigation</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              <li><Link to="/" style={{ color: "#A8BEB1", textDecoration: "none", fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}><HomeIcon size={14} /> Accueil</Link></li>
              <li><Link to="/catalogue" style={{ color: "#A8BEB1", textDecoration: "none", fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}><Grid size={14} /> Tous nos produits</Link></li>
              <li><Link to="/a-propos" style={{ color: "#A8BEB1", textDecoration: "none", fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}><Info size={14} /> À propos de nous</Link></li>
              <li><Link to="/mes-commandes" style={{ color: "#A8BEB1", textDecoration: "none", fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}><Package size={14} /> Suivi de mes commandes</Link></li>
            </ul>
          </div>

          {/* COLONNE 3: BOUTIQUES & HORAIRES */}
          <div>
            <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, color: "#fff", fontWeight: 800 }}>Boutiques & Horaires</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#A8BEB1", fontSize: 13 }}>
                <Clock size={16} style={{ color: "#A7F3D0", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 12.5 }}>Horaires d'ouverture :</div>
                  <div>{horaires}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#A8BEB1", fontSize: 13 }}>
                <MapPin size={16} style={{ color: "#A7F3D0", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 12.5 }}>Adresse principale :</div>
                  <div>{boutique?.adresse || "Adresse non renseignée"}</div>
                </div>
              </div>

              {boutique?.adresse2 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#A8BEB1", fontSize: 13 }}>
                  <MapPin size={16} style={{ color: "#A7F3D0", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 12.5 }}>Seconde adresse :</div>
                    <div>{boutique.adresse2}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE 4: NOUS CONTACTER & RÉSEAUX SOCIAUX ACCOLÉS */}
          <div>
            <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, color: "#fff", fontWeight: 800 }}>Nous Contacter</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#A8BEB1", fontSize: 13 }}>
                <Phone size={16} style={{ color: "#A7F3D0", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 12.5 }}>Tél 1 : {boutique?.telephone || "+33 1 23 45 67 89"}</div>
                  {boutique?.telephone2 && (
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 12.5, marginTop: 2 }}>Tél 2 : {boutique.telephone2}</div>
                  )}
                </div>
              </li>
              {boutique?.emailContact && (
                <li style={{ display: "flex", alignItems: "center", gap: 8, color: "#A8BEB1", fontSize: 13 }}>
                  <Mail size={16} style={{ color: "#A7F3D0", flexShrink: 0 }} />
                  <span>{boutique.emailContact}</span>
                </li>
              )}
            </ul>

            {/* RÉSEAUX SOCIAUX DÉPLACÉS À CÔTÉ DE NOUS CONTACTER */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#A7F3D0", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                Suivez-nous :
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Facebook"
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1877F2"; e.currentTarget.style.transform = "scale(1.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <Facebook size={16} />
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Instagram"
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#E4405F"; e.currentTarget.style.transform = "scale(1.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <Instagram size={16} />
                </a>
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="TikTok"
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#000000"; e.currentTarget.style.transform = "scale(1.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.42V8.9a6.34 6.34 0 0 0-5.46 6.31 6.34 6.34 0 1 0 11.8-3.41V9.5a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.0-0.93z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* MOYENS DE PAIEMENT ACCEPTÉS SLIM */}
        <div style={{ maxWidth: 1280, margin: "0 auto 16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.8, color: "#8AA695", fontWeight: 700 }}>
              🔒 Paiement 100% Sécurisé & Modes de règlement acceptés :
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* MVola */}
              <div style={{ background: "#fff", padding: "3px 8px", borderRadius: 6, display: "flex", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <MvolaLogo height={20} />
              </div>

              {/* WERO */}
              <div style={{ background: "#fff", padding: "3px 7px", borderRadius: 6, display: "flex", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <WeroLogo height={20} />
              </div>

              {/* Cartes / Paypal / Virement */}
              <div style={{ background: "#fff", padding: "3px 7px", borderRadius: 6, display: "flex", alignItems: "center", gap: 5, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <VisaLogo height={15} />
                <MastercardLogo height={15} />
                <VirementLogo height={15} />
                <PaypalLogo height={15} />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR SLIM */}
        <div style={{ maxWidth: 1280, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", color: "#7B9686", fontSize: 12, gap: 10 }}>
          <div>© 2026 {boutique?.nom || "Comores Biachara"}. Tous droits réservés.</div>
          <div>Qualité & Fraîcheur Garanties</div>
        </div>
      </footer>

      {/* ── BOUTON FLOTTANT WHATSAPP STYLE ASSISTANT IA (GLISSANT & FLUIDE) ── */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="bs-wa-floating"
        title="Discuter sur WhatsApp"
        aria-label="Contacter le service client sur WhatsApp"
      >
        <span className="bs-wa-bubble">
          <MessageCircle size={15} color="#25D366" />
          <span>Discutez avec nous</span>
        </span>
        <div className="bs-wa-button">
          <MessageCircle size={26} fill="#ffffff" color="#25D366" />
          <span className="bs-wa-dot" />
          <span className="bs-wa-pulse" />
        </div>
      </a>
    </>
  );
}
