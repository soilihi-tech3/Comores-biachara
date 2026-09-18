import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, User, Mail, Phone, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", motDePasse: "" });
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErreur("");
    setLoading(true);
    try {
      await register(form.nom, form.email, form.telephone, form.motDePasse);
      navigate("/");
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de créer le compte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bs-auth-container">
      <div className="bs-auth-card">
        <div className="bs-auth-header">
          <div className="bs-auth-icon">
            <UserPlus size={26} color="var(--forest)" />
          </div>
          <h2>Créer un compte client</h2>
          <p>Rejoignez-nous pour commander vos produits frais et bio en quelques clics</p>
        </div>

        {erreur && (
          <div className="bs-auth-error">
            <AlertCircle size={18} />
            <span>{erreur}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="bs-auth-form">
          <div className="bs-input-group">
            <label>Nom complet</label>
            <div className="bs-input-wrapper">
              <User size={18} className="bs-input-icon" />
              <input
                type="text"
                placeholder="Prénom et Nom"
                required
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
            </div>
          </div>

          <div className="bs-input-group">
            <label>Téléphone Mobile *</label>
            <div className="bs-input-wrapper">
              <Phone size={18} className="bs-input-icon" />
              <input
                type="tel"
                placeholder="+269 330 00 00 ou +33 6 00 00 00 00"
                required
                value={form.telephone}
                onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              />
            </div>
          </div>

          <div className="bs-input-group">
            <label>Adresse e-mail (Optionnel)</label>
            <div className="bs-input-wrapper">
              <Mail size={18} className="bs-input-icon" />
              <input
                type="email"
                placeholder="votre.email@exemple.com (optionnel)"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="bs-input-group">
            <label>Mot de passe</label>
            <div className="bs-input-wrapper">
              <Lock size={18} className="bs-input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={form.motDePasse}
                onChange={(e) => setForm((f) => ({ ...f, motDePasse: e.target.value }))}
              />
            </div>
          </div>

          <button className="bs-auth-btn" disabled={loading}>
            {loading ? "Création en cours..." : "Créer mon compte client"}
          </button>
        </form>

        <div className="bs-auth-footer">
          <span>Vous avez déjà un compte ?</span>{" "}
          <Link to="/connexion">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
