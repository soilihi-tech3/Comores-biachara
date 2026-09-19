import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, User, Mail, Phone, Lock, AlertCircle, ShieldCheck, RefreshCw, Send, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Register() {
  const { register, verifyOtp, resendOtp, boutique } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = info, 2 = otp
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", motDePasse: "" });
  const [otpCode, setOtpCode] = useState("");
  const [targetContact, setTargetContact] = useState({ email: "", telephone: "" });

  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async function onSubmitRegister(e) {
    e.preventDefault();
    setErreur("");
    setSucces("");
    setLoading(true);
    try {
      const res = await register(form.nom, form.email, form.telephone, form.motDePasse);
      if (res.requireOtp) {
        setTargetContact({ email: res.email || form.email, telephone: res.telephone || form.telephone });
        setStep(2);
        setTimeLeft(900);
        setSucces("Code OTP envoyé par e-mail ! Veuillez saisir les 6 chiffres ci-dessous.");
      } else {
        navigate("/");
      }
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de créer le compte.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitOtp(e) {
    e.preventDefault();
    setErreur("");
    setSucces("");
    if (!otpCode || otpCode.trim().length !== 6) {
      setErreur("Veuillez saisir un code OTP valide à 6 chiffres.");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(targetContact.email, targetContact.telephone, otpCode.trim());
      navigate("/");
    } catch (err) {
      setErreur(err.response?.data?.message || "Code OTP incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setErreur("");
    setSucces("");
    setLoading(true);
    try {
      const res = await resendOtp(targetContact.email, targetContact.telephone);
      setSucces(res.message || "Un nouveau code OTP a été envoyé.");
      setTimeLeft(900);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de renvoyer le code.");
    } finally {
      setLoading(false);
    }
  }

  const shopPhone = boutique?.telephone || "2693300000";
  const whatsappMsg = encodeURIComponent(`Bonjour ${boutique?.nom || "Boutique"}, je crée mon compte client (${targetContact.telephone}) et je souhaite recevoir assistance / mon code de sécurité OTP.`);
  const whatsappUrl = `https://wa.me/${shopPhone.replace(/[^0-9]/g, "")}?text=${whatsappMsg}`;

  return (
    <div className="bs-auth-container">
      <div className="bs-auth-card">
        {step === 1 ? (
          <>
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

            <form onSubmit={onSubmitRegister} className="bs-auth-form">
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
          </>
        ) : (
          <>
            <div className="bs-auth-header">
              <div className="bs-auth-icon" style={{ background: "rgba(45,134,83,0.12)" }}>
                <ShieldCheck size={28} color="var(--forest)" />
              </div>
              <h2>Vérification de sécurité OTP</h2>
              <p>Un code d'activation à 6 chiffres a été généré pour <strong>{targetContact.email || targetContact.telephone}</strong></p>
            </div>

            {succes && (
              <div style={{ background: "#E8F5E9", color: "#2E7D32", border: "1px solid #C8E6C9", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Send size={16} /> <span>{succes}</span>
              </div>
            )}

            {erreur && (
              <div className="bs-auth-error">
                <AlertCircle size={18} />
                <span>{erreur}</span>
              </div>
            )}

            <form onSubmit={onSubmitOtp} className="bs-auth-form">
              <div className="bs-input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ margin: 0, fontWeight: 700 }}>Code de sécurité (6 chiffres)</label>
                  <span style={{ fontSize: 12, color: timeLeft < 120 ? "#D32F2F" : "var(--muted)", fontWeight: 700 }}>
                    Expire dans : {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="bs-input-wrapper">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                    style={{ textAlign: "center", letterSpacing: "8px", fontSize: "22px", fontWeight: "800", color: "var(--forest-dark)" }}
                  />
                </div>
              </div>

              <button className="bs-auth-btn" disabled={loading}>
                {loading ? "Vérification..." : "Valider et Accéder au Compte"}
              </button>
            </form>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "none", border: "1px solid var(--line)", padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
              >
                <RefreshCw size={14} /> Renvoyer le code par e-mail
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", padding: "10px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 700 }}
              >
                <MessageSquare size={16} /> Demander de l'aide via WhatsApp
              </a>
            </div>

            <div className="bs-auth-footer" style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
              >
                Modifier mes informations d'inscription
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

