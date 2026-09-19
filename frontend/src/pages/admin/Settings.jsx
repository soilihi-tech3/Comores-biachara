import React, { useEffect, useState } from "react";
import { Plus, Trash2, Image, Layers, LayoutGrid, Store, Phone, MapPin, Mail, Info, Save, CreditCard, ToggleLeft, ToggleRight, Banknote, Smartphone } from "lucide-react";
import api from "../../api";
import ImageUploader from "../../components/ImageUploader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminSettings({ defaultTab = "general" }) {
  const { refreshBoutique } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [boutique, setBoutique] = useState(null);
  const [categories, setCategories] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => { 
    api.get("/admin/boutique").then((res) => {
      const data = res.data;
      if (typeof data.bannerSlides === "string") {
        try { data.bannerSlides = JSON.parse(data.bannerSlides); } catch (e) { data.bannerSlides = []; }
      }
      if (!Array.isArray(data.bannerSlides)) data.bannerSlides = [];

      if (typeof data.sideBanners === "string") {
        try { data.sideBanners = JSON.parse(data.sideBanners); } catch (e) { data.sideBanners = []; }
      }
      if (!Array.isArray(data.sideBanners)) data.sideBanners = [];

      if (!data.modesPaiement) {
        data.modesPaiement = { especes: true, mvola: true, holam: true, carte: false };
      }

      setBoutique(data);
    }); 

    api.get("/admin/categories").then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  async function save() {
    await api.put("/admin/boutique", boutique);
    refreshBoutique();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!boutique) return <div style={{ padding: 40 }}>Chargement des paramètres...</div>;
  const set = (k, v) => setBoutique((b) => ({ ...b, [k]: v }));
  const slidesList = Array.isArray(boutique.bannerSlides) ? boutique.bannerSlides : [];
  const sideList = Array.isArray(boutique.sideBanners) ? boutique.sideBanners : [];
  const modesPaiement = boutique.modesPaiement || { especes: true, mvola: true, holam: true, carte: false };

  function togglePaymentMode(key) {
    set("modesPaiement", {
      ...modesPaiement,
      [key]: !modesPaiement[key]
    });
  }

  // Home Slides Actions
  function addSlide() {
    const newSlide = {
      id: Date.now(),
      title: "Nouvelle diapositive",
      subtitle: "Offres fraîches du jour",
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Découvrir le marché",
      categoryId: categories[0]?.id || ""
    };
    set("bannerSlides", [...slidesList, newSlide]);
  }

  function updateSlide(idx, field, value) {
    const updated = [...slidesList];
    updated[idx] = { ...updated[idx], [field]: value };
    set("bannerSlides", updated);
  }

  function removeSlide(idx) {
    set("bannerSlides", slidesList.filter((_, i) => i !== idx));
  }

  // Side Banners Actions
  function addSideBanner() {
    const newSide = {
      id: Date.now(),
      title: "Promotions Spéciales",
      subtitle: "Jusqu'à -30% cette semaine",
      imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
      buttonText: "Acheter maintenant",
      categoryId: categories[0]?.id || ""
    };
    set("sideBanners", [...sideList, newSide]);
  }

  function updateSideBanner(idx, field, value) {
    const updated = [...sideList];
    updated[idx] = { ...updated[idx], [field]: value };
    set("sideBanners", updated);
  }

  function removeSideBanner(idx) {
    set("sideBanners", sideList.filter((_, i) => i !== idx));
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0, color: "var(--forest-dark)" }}>Paramètres & Bannières</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13.5 }}>
            Gérez l'identité de l'application, les bannières de la page d'accueil et les informations de contact.
          </p>
        </div>
        <button className="bs-btn-primary" onClick={save} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Save size={16} /> Enregistrer les modifications
        </button>
      </div>

      {saved && (
        <div style={{ background: "#EBF7F0", color: "#1F4D3A", padding: "12px 16px", borderRadius: 10, fontWeight: 700, marginBottom: 20 }}>
          ✓ Toutes les modifications ont été enregistrées avec succès !
        </div>
      )}

      {/* TAB NAVIGATION BAR */}
      <div style={{ display: "flex", gap: 10, borderBottom: "2px solid var(--line)", marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("general")}
          style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13.5,
            color: activeTab === "general" ? "var(--forest)" : "var(--muted)",
            borderBottom: activeTab === "general" ? "3px solid var(--forest)" : "3px solid transparent",
            marginBottom: -2, display: "flex", alignItems: "center", gap: 8
          }}
        >
          <Store size={17} /> Identité & Contacts
        </button>

        <button
          onClick={() => setActiveTab("home_banners")}
          style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13.5,
            color: activeTab === "home_banners" ? "var(--forest)" : "var(--muted)",
            borderBottom: activeTab === "home_banners" ? "3px solid var(--forest)" : "3px solid transparent",
            marginBottom: -2, display: "flex", alignItems: "center", gap: 8
          }}
        >
          <Image size={17} /> Home Banners (Slider)
        </button>

        <button
          onClick={() => setActiveTab("side_banners")}
          style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13.5,
            color: activeTab === "side_banners" ? "var(--forest)" : "var(--muted)",
            borderBottom: activeTab === "side_banners" ? "3px solid var(--forest)" : "3px solid transparent",
            marginBottom: -2, display: "flex", alignItems: "center", gap: 8
          }}
        >
          <LayoutGrid size={17} /> Home Side Banners
        </button>

        <button
          onClick={() => setActiveTab("payment_modes")}
          style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13.5,
            color: activeTab === "payment_modes" ? "var(--forest)" : "var(--muted)",
            borderBottom: activeTab === "payment_modes" ? "3px solid var(--forest)" : "3px solid transparent",
            marginBottom: -2, display: "flex", alignItems: "center", gap: 8
          }}
        >
          <CreditCard size={17} /> Modes de Paiement
        </button>
      </div>

      {/* TAB 1: IDENTITÉ & CONTACTS */}
      {activeTab === "general" && (
        <div className="bs-panel">
          <h3 style={{ marginTop: 0, fontSize: 18, color: "var(--forest-dark)" }}>Identité & Informations de la Boutique</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div className="bs-field">
              <label>Nom de la boutique</label>
              <input className="bs-input" value={boutique.nom || ""} onChange={(e) => set("nom", e.target.value)} />
            </div>

            <div className="bs-field">
              <label>Email de Contact</label>
              <input className="bs-input" type="email" value={boutique.emailContact || ""} onChange={(e) => set("emailContact", e.target.value)} placeholder="contact@maboutique.com" />
            </div>

            <div className="bs-field">
              <label>Frais de livraison à domicile (€)</label>
              <input className="bs-input" type="number" step="0.01" value={boutique.fraisLivraison ?? 10} onChange={(e) => set("fraisLivraison", parseFloat(e.target.value) || 0)} placeholder="ex: 10" />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <ImageUploader
              label="Logo de la boutique (Upload direct ou URL)"
              value={boutique.logoUrl || ""}
              onChange={(url) => set("logoUrl", url)}
            />
          </div>

          <h3 style={{ marginTop: 28, fontSize: 16, color: "var(--forest-dark)" }}>Téléphones & Adresses</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="bs-field">
              <label>Téléphone N° 1</label>
              <input className="bs-input" value={boutique.telephone || ""} onChange={(e) => set("telephone", e.target.value)} placeholder="+33 6 00 00 00 00" />
            </div>
            <div className="bs-field">
              <label>Téléphone N° 2 (Facultatif)</label>
              <input className="bs-input" value={boutique.telephone2 || ""} onChange={(e) => set("telephone2", e.target.value)} placeholder="+33 1 00 00 00 00" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
            <div className="bs-field">
              <label>Adresse Principale N° 1</label>
              <input className="bs-input" value={boutique.adresse || ""} onChange={(e) => set("adresse", e.target.value)} placeholder="123 Rue de la République, Paris" />
            </div>
            <div className="bs-field">
              <label>Adresse Secondaire N° 2 (Facultatif)</label>
              <input className="bs-input" value={boutique.adresse2 || ""} onChange={(e) => set("adresse2", e.target.value)} placeholder="Entrepôt B, Zone Industrielle" />
            </div>
          </div>

          <div className="bs-field" style={{ marginTop: 16 }}>
            <label style={{ fontWeight: 700, color: "var(--forest-dark)" }}>📍 Adresse & Instructions détaillées pour le Point de Retrait en Boutique</label>
            <p style={{ margin: "2px 0 8px", fontSize: 12.5, color: "var(--muted)" }}>
              Décrivez exactement où se trouve la boutique (ex: repères, étage, numéro de porte) pour les clients qui choisissent "Retrait en boutique".
            </p>
            <textarea
              className="bs-input"
              rows={3}
              value={boutique.adresseRetrait || ""}
              onChange={(e) => set("adresseRetrait", e.target.value)}
              placeholder="Ex: 12 Rue des Marchands, Moroni — Entrez par le portail vert au rez-de-chaussée à côté de la banque."
              style={{ padding: 12 }}
            />
          </div>

          <h3 style={{ marginTop: 28, fontSize: 16, color: "var(--forest-dark)" }}>Horaires d'Ouverture & WhatsApp Contact</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="bs-field">
              <label>Horaires d'ouverture (Affiché dans le footer)</label>
              <input
                className="bs-input"
                value={boutique.horairesOuverture || "Tous les jours de 08h30 à 23h00"}
                onChange={(e) => set("horairesOuverture", e.target.value)}
                placeholder="Ex: Tous les jours de 08h30 à 23h00"
              />
            </div>
            <div className="bs-field">
              <label>Numéro WhatsApp Contact Direct (Ex: 2693300000 ou 33600000000)</label>
              <input
                className="bs-input"
                value={boutique.whatsappNumber || ""}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                placeholder="Ex: 2693300000 (sans + ni espaces)"
              />
            </div>
          </div>

          <h3 style={{ marginTop: 28, fontSize: 16, color: "var(--forest-dark)" }}>Réseaux Sociaux (Liens Footer)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div className="bs-field">
              <label>Lien Facebook</label>
              <input
                className="bs-input"
                value={boutique.facebookUrl || ""}
                onChange={(e) => set("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/votrepage"
              />
            </div>
            <div className="bs-field">
              <label>Lien Instagram</label>
              <input
                className="bs-input"
                value={boutique.instagramUrl || ""}
                onChange={(e) => set("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/votrecompte"
              />
            </div>
            <div className="bs-field">
              <label>Lien TikTok</label>
              <input
                className="bs-input"
                value={boutique.tiktokUrl || ""}
                onChange={(e) => set("tiktokUrl", e.target.value)}
                placeholder="https://tiktok.com/@votrecompte"
              />
            </div>
          </div>

          <h3 style={{ marginTop: 28, fontSize: 16, color: "var(--forest-dark)" }}>Section « À propos de nous »</h3>
          <div className="bs-field">
            <label>Description & Présentation de l'entreprise</label>
            <textarea
              className="bs-input"
              rows={4}
              value={boutique.aProposText || ""}
              onChange={(e) => set("aProposText", e.target.value)}
              placeholder="Présentez votre entreprise, vos valeurs, vos produits frais et bio..."
              style={{ padding: 12 }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: HOME BANNERS (SLIDER) */}
      {activeTab === "home_banners" && (
        <div className="bs-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--forest-dark)", display: "flex", alignItems: "center", gap: 8 }}>
                <Image size={20} /> Liste des Home Banners (Slider Principal)
              </h3>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                Ajoutez et organisez les grands visuels défilants de la page d'accueil.
              </div>
            </div>
            <button className="bs-btn-primary" style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }} onClick={addSlide}>
              <Plus size={16} /> Ajouter une diapositive
            </button>
          </div>

          {slidesList.length === 0 && (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>Aucune diapositive configurée. Cliquez sur "Ajouter une diapositive".</p>
          )}

          {slidesList.map((slide, idx) => (
            <div key={slide.id || idx} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 18, marginBottom: 20, background: "var(--paper)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: "var(--forest-dark)" }}>Diapositive #{idx + 1}</span>
                <button className="bs-icon-btn" style={{ color: "#B4483A" }} onClick={() => removeSlide(idx)}>
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
                <div className="bs-field">
                  <label>Titre principal</label>
                  <input className="bs-input" value={slide.title || ""} onChange={(e) => updateSlide(idx, "title", e.target.value)} />
                </div>

                <div className="bs-field">
                  <label>Sous-titre / Accroche</label>
                  <input className="bs-input" value={slide.subtitle || ""} onChange={(e) => updateSlide(idx, "subtitle", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <ImageUploader
                  label="Photo de la diapositive (Depuis l'ordinateur direct OU par URL)"
                  value={slide.imageUrl || ""}
                  onChange={(url) => updateSlide(idx, "imageUrl", url)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="bs-field">
                  <label>Texte du bouton</label>
                  <input className="bs-input" value={slide.buttonText || ""} onChange={(e) => updateSlide(idx, "buttonText", e.target.value)} />
                </div>

                <div className="bs-field">
                  <label>Associer à une Catégorie (Redirection au clic)</label>
                  <select 
                    className="bs-select" 
                    value={slide.categoryId || ""} 
                    onChange={(e) => updateSlide(idx, "categoryId", e.target.value)}
                  >
                    <option value="">-- Toutes les catégories --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: HOME SIDE BANNERS */}
      {activeTab === "side_banners" && (
        <div className="bs-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--forest-dark)", display: "flex", alignItems: "center", gap: 8 }}>
                <LayoutGrid size={20} /> Liste des Home Side Banners
              </h3>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                Bannières secondaires affichées sous les promotions de la page d'accueil.
              </div>
            </div>
            <button className="bs-btn-primary" style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }} onClick={addSideBanner}>
              <Plus size={16} /> Ajouter une bannière latérale
            </button>
          </div>

          {sideList.length === 0 && (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>Aucune bannière latérale configurée. Cliquez sur "Ajouter une bannière latérale".</p>
          )}

          {sideList.map((side, idx) => (
            <div key={side.id || idx} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 18, marginBottom: 20, background: "var(--paper)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: "var(--forest-dark)" }}>Bannière Latérale #{idx + 1}</span>
                <button className="bs-icon-btn" style={{ color: "#B4483A" }} onClick={() => removeSideBanner(idx)}>
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
                <div className="bs-field">
                  <label>Titre de l'offre</label>
                  <input className="bs-input" value={side.title || ""} onChange={(e) => updateSideBanner(idx, "title", e.target.value)} />
                </div>

                <div className="bs-field">
                  <label>Sous-titre / Promo</label>
                  <input className="bs-input" value={side.subtitle || ""} onChange={(e) => updateSideBanner(idx, "subtitle", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <ImageUploader
                  label="Photo de la bannière (Depuis l'ordinateur direct OU par URL)"
                  value={side.imageUrl || ""}
                  onChange={(url) => updateSideBanner(idx, "imageUrl", url)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="bs-field">
                  <label>Texte du bouton</label>
                  <input className="bs-input" value={side.buttonText || ""} onChange={(e) => updateSideBanner(idx, "buttonText", e.target.value)} />
                </div>

                <div className="bs-field">
                  <label>Associer à une Catégorie (Redirection au clic)</label>
                  <select 
                    className="bs-select" 
                    value={side.categoryId || ""} 
                    onChange={(e) => updateSideBanner(idx, "categoryId", e.target.value)}
                  >
                    <option value="">-- Toutes les catégories --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: MODES DE PAIEMENT */}
      {activeTab === "payment_modes" && (
        <div className="bs-panel">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "var(--forest-dark)", display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={20} /> Configuration des Modes de Paiement
            </h3>
            <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
              Choisissez les moyens de paiement autorisés et affichés aux clients lors de la validation du panier.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { key: "especes", label: "Espèces (Cash)", sub: "Paiement à la livraison / réception au comptoir", Icon: Banknote },
              { key: "mvola", label: "Mvola", sub: "Paiement mobile Money Mvola", Icon: Smartphone },
              { key: "holam", label: "Holam", sub: "Paiement mobile Money Holam", Icon: Smartphone },
              { key: "carte", label: "Carte Bancaire", sub: "Paiement en ligne Visa / Mastercard", Icon: CreditCard },
            ].map((item) => {
              const isEnabled = !!modesPaiement[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => togglePaymentMode(item.key)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "20px", borderRadius: 16,
                    border: `2px solid ${isEnabled ? "var(--forest)" : "var(--line)"}`,
                    background: isEnabled ? "var(--forest-light)" : "#FAFAFA",
                    cursor: "pointer", transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isEnabled ? "var(--forest)" : "var(--paper)",
                      color: isEnabled ? "#fff" : "var(--muted)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <item.Icon size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: isEnabled ? "var(--forest-dark)" : "var(--ink)" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                        {item.sub}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: isEnabled ? "var(--forest)" : "var(--muted)" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                      {isEnabled ? "Disponible" : "Indisponible"}
                    </span>
                    {isEnabled ? (
                      <ToggleRight size={34} color="var(--forest)" />
                    ) : (
                      <ToggleLeft size={34} color="#A0AEC0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button className="bs-btn-primary" style={{ padding: "14px 28px", marginTop: 10 }} onClick={save}>
        Enregistrer toutes les modifications
      </button>
    </>
  );
}

