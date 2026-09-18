import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { LogIn, Lock, Mail, AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", motDePasse: "" });
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErreur("");
    setLoading(true);
    try {
      const user = await login(form.email, form.motDePasse);
      const redirect = params.get("redirect");
      if (redirect) navigate(redirect);
      else if (user.role === "super_admin") navigate("/super-admin");
      else if (user.role === "admin" || user.role === "employe") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setErreur(err.response?.data?.message || "Identifiants ou mot de passe incorrects.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(email, pw) {
    setForm({ email, motDePasse: pw });
    setErreur("");
  }

  return (
    <div className="bs-auth-container">
      <div className="bs-auth-card">
        <div className="bs-auth-header">
          <div className="bs-auth-icon">
            <LogIn size={26} color="var(--forest)" />
          </div>
          <h2>Espace Connexion</h2>
          <p>Connectez-vous pour accéder à votre espace client ou administration</p>
        </div>

        {erreur && (
          <div className="bs-auth-error">
            <AlertCircle size={18} />
            <span>{erreur}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="bs-auth-form">
          <div className="bs-input-group">
            <label>Téléphone ou Adresse e-mail</label>
            <div className="bs-input-wrapper">
              <Mail size={18} className="bs-input-icon" />
              <input
                type="text"
                placeholder="Ex: +269 330 00 00 ou nom@exemple.com"
                required
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
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="bs-auth-footer">
          <span>Pas encore de compte client ?</span>{" "}
          <Link to="/inscription">Créer un compte</Link>
        </div>

        {/* DEMO ACCOUNTS QUICK LOGIN */}
        <div className="bs-demo-box">
          <div className="bs-demo-title">
            <ShieldCheck size={16} /> Comptes de démonstration (clic rapide) :
          </div>
          <div className="bs-demo-chips">
            <button
              type="button"
              className="bs-demo-chip"
              onClick={() => fillDemo("admin@marche-vert.com", "Admin123!")}
            >
              <CheckCircle2 size={13} /> Admin (admin@marche-vert.com)
            </button>
            <button
              type="button"
              className="bs-demo-chip"
              onClick={() => fillDemo("client@example.com", "Client123!")}
            >
              <CheckCircle2 size={13} /> Client (client@example.com)
            </button>
            <button
              type="button"
              className="bs-demo-chip"
              onClick={() => fillDemo("superadmin@boutique-saas.com", "SuperAdmin123!")}
            >
              <CheckCircle2 size={13} /> Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
