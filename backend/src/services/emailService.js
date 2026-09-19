require("dotenv").config();
const { BrevoClient } = require("@getbrevo/brevo");
const { renderTemplate } = require("../utils/templateEngine");
const { EmailLog } = require("../models");
const { getCache, setCache } = require("../config/cache");

// Singleton client Brevo
let brevoClientInstance = null;
function getBrevoClient() {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || "").trim();
  if (!apiKey) return null;

  if (!brevoClientInstance) {
    brevoClientInstance = new BrevoClient({ apiKey });
  }
  return brevoClientInstance;
}

/**
 * Enregistrement du log d'email en base de données (emails_log)
 */
async function logEmailSent(email, type, statut, errorMessage = null) {
  try {
    await EmailLog.create({
      email,
      type,
      statut,
      error_message: errorMessage
    });
  } catch (err) {
    console.error("⚠️ [EMAIL LOG ERROR] Impossible d'enregistrer le log d'email:", err.message);
  }
}

/**
 * Comptabiliser les envois quotidiens dans Redis (quota 300/jour Brevo gratuit)
 */
async function trackDailyQuota() {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const redisKey = `emails_sent_today:${todayStr}`;
    const currentCount = (await getCache(redisKey)) || 0;
    const newCount = Number(currentCount) + 1;
    await setCache(redisKey, newCount, 86400);

    if (newCount === 250) {
      console.warn(`⚠️ [BREVO QUOTA ALERT] Approche du quota quotidien Brevo : ${newCount}/300 emails envoyés aujourd'hui (${todayStr}).`);
    } else if (newCount >= 300) {
      console.error(`🚨 [BREVO QUOTA EXCEEDED] Quota quotidien de 300 emails Brevo atteint pour aujourd'hui (${todayStr}) !`);
    }
  } catch (e) {
    // Ne pas bloquer si Redis indisponible
  }
}

/**
 * Fonction cœur d'envoi d'e-mail via l'API REST Brevo
 */
async function sendEmailCore({ to, subject, html, type = "general" }) {
  if (!to) {
    console.warn("⚠️ [EMAIL SERVICE] Destinataire manquant.");
    return false;
  }

  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || "soilihiabdou99@gmail.com").trim();
  const senderName = (process.env.BREVO_SENDER_NAME || "EasyMarket").trim();

  // Version texte brut pour maximiser la délivrabilité
  const textContent = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Envoi via l'API REST officielle Brevo
  const client = getBrevoClient();
  if (client) {
    try {
      const response = await client.transactionalEmails.sendTransacEmail({
        sender: { name: senderName, email: senderEmail },
        replyTo: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: textContent
      });

      console.log(`✉️ [BREVO REST API SUCCESS] E-mail "${type}" envoyé à ${to} (MessageId: ${response?.messageId || 'OK'})`);
      await trackDailyQuota();
      await logEmailSent(to, type, "succes");
      return true;
    } catch (err) {
      const errMsg = err?.body?.message || err?.message || JSON.stringify(err);
      console.error(`❌ [BREVO REST API ERROR] Échec d'envoi à ${to} :`, errMsg);
      await logEmailSent(to, type, "echec", errMsg);
    }
  } else {
    console.warn("⚠️ [EMAIL SERVICE] BREVO_API_KEY non configurée.");
  }

  // 2. Fallback Mode Dev / Logs
  console.log("\n=================== ✉️ EMAIL TRANSACTIONNEL (DEV LOG FALLBACK) ===================");
  console.log(`Type         : ${type}`);
  console.log(`Destinataire : ${to}`);
  console.log(`Sujet        : ${subject}`);
  console.log("--------------------------------------------------------------------------");
  console.log(textContent.substring(0, 300) + "...");
  console.log("==========================================================================\n");

  return false;
}

/**
 * 1. Envoie un e-mail OTP avec le code à 6 chiffres
 */
async function envoyerOTP(email, code, nomUtilisateur = "Client") {
  try {
    const html = renderTemplate("otp.html", {
      nom: nomUtilisateur || "Client",
      code,
      appName: process.env.BREVO_SENDER_NAME || "EasyMarket"
    });

    const subject = `${code} est votre code de vérification — EasyMarket`;
    return await sendEmailCore({ to: email, subject, html, type: "otp" });
  } catch (err) {
    console.error("❌ [EMAIL OTP ERROR]:", err.message);
    return false;
  }
}

/**
 * 2. Envoie une confirmation de commande avec calcul exact du total et lien direct de suivi
 */
async function envoyerConfirmationCommande(email, commande, boutiqueNom = "EasyMarket") {
  try {
    const plainOrder = commande && typeof commande.get === "function" ? commande.get({ plain: true }) : (commande || {});
    const rawId = plainOrder.id || plainOrder.orderId || 0;
    const cmdId = "COM-B" + String(rawId).padStart(3, "0");

    const itemsListHtml = (plainOrder.items || []).map(it => {
      const nomProd = it.product?.nom || it.nomProduit || 'Produit';
      const qty = Number(it.quantite || 1);
      const unitPrice = Number(it.prixUnitaire || it.prix || 0);
      const itemTotal = unitPrice * qty;
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; font-weight: 600;">${nomProd}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; text-align: center;">x${qty}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; text-align: right; font-weight: 700;">${itemTotal.toLocaleString('fr-FR')} €</td>
        </tr>
      `;
    }).join("");

    const clientNom = plainOrder.client?.nom || plainOrder.nomClient || "Cher Client";
    const totalValue = plainOrder.total !== undefined ? Number(plainOrder.total) : ((Number(plainOrder.sousTotal) || 0) + (Number(plainOrder.fraisLivraison) || 0));
    const totalFormatted = totalValue.toLocaleString('fr-FR');
    const modeLiv = plainOrder.modeLivraison === 'domicile' ? 'Livraison à domicile' : 'Retrait en boutique';
    const moyenPaiement = plainOrder.moyenPaiement || 'Carte bancaire / Espèces';

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const suiviUrl = rawId ? `${baseUrl}/mes-commandes?orderId=${rawId}` : `${baseUrl}/mes-commandes`;

    const html = renderTemplate("confirmation-commande.html", {
      nom: clientNom,
      commandeId: cmdId,
      boutiqueNom: boutiqueNom || "EasyMarket",
      itemsHtml: itemsListHtml,
      total: totalFormatted,
      modeLivraison: modeLiv,
      moyenPaiement,
      suiviUrl
    });

    const subject = `Commande #${cmdId} confirmée — ${boutiqueNom}`;
    return await sendEmailCore({ to: email, subject, html, type: "confirmation_commande" });
  } catch (err) {
    console.error("❌ [EMAIL CONFIRMATION ERROR]:", err.message);
    return false;
  }
}

/**
 * 3. Envoie une notification de changement de statut de commande
 */
async function envoyerChangementStatut(email, commande, ancienStatut, nouveauStatut, boutiqueNom = "EasyMarket") {
  try {
    const plainOrder = commande && typeof commande.get === "function" ? commande.get({ plain: true }) : (commande || {});
    const rawId = plainOrder.id || plainOrder.orderId || 0;
    const cmdId = "COM-B" + String(rawId).padStart(3, "0");

    const statusLabels = {
      en_attente: "En attente de confirmation",
      validee: "Confirmée",
      en_preparation: "En cours de préparation",
      pret_retrait: "Prête à récupérer en boutique",
      en_livraison: "En cours de livraison",
      recuperee: "Récupérée",
      livree: "Livrée",
      annulee: "Annulée"
    };

    const statusTitle = statusLabels[nouveauStatut] || nouveauStatut;
    const clientNom = plainOrder.client?.nom || plainOrder.nomClient || "Cher Client";

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const suiviUrl = rawId ? `${baseUrl}/mes-commandes?orderId=${rawId}` : `${baseUrl}/mes-commandes`;

    const html = renderTemplate("changement-statut.html", {
      nom: clientNom,
      commandeId: cmdId,
      nouveauStatut: statusTitle,
      boutiqueNom: boutiqueNom || "EasyMarket",
      suiviUrl
    });

    const subject = `Mise à jour Commande #${cmdId} : ${statusTitle} — ${boutiqueNom}`;
    return await sendEmailCore({ to: email, subject, html, type: "statut_commande" });
  } catch (err) {
    console.error("❌ [EMAIL STATUT ERROR]:", err.message);
    return false;
  }
}

/**
 * 4. Envoie un e-mail de réinitialisation de mot de passe
 */
async function envoyerResetMotDePasse(email, resetUrl, nomUtilisateur = "Client") {
  try {
    const html = renderTemplate("reset-password.html", {
      nom: nomUtilisateur || "Client",
      resetUrl,
      appName: process.env.BREVO_SENDER_NAME || "EasyMarket"
    });

    const subject = `Réinitialisation de votre mot de passe — EasyMarket`;
    return await sendEmailCore({ to: email, subject, html, type: "reset_password" });
  } catch (err) {
    console.error("❌ [EMAIL RESET PASSWORD ERROR]:", err.message);
    return false;
  }
}

module.exports = {
  envoyerOTP,
  envoyerConfirmationCommande,
  envoyerChangementStatut,
  envoyerResetMotDePasse,
  sendEmailCore,
  // Alias de rétrocompatibilité
  sendMail: ({ to, subject, html }) => sendEmailCore({ to, subject, html, type: "legacy" }),
  sendOtpEmail: (email, name, code) => envoyerOTP(email, code, name),
  sendOrderConfirmationEmail: (email, name, order, boutiqueName) => {
    const plainOrder = order && typeof order.get === "function" ? order.get({ plain: true }) : (order || {});
    return envoyerConfirmationCommande(email, { ...plainOrder, client: { nom: name } }, boutiqueName);
  },
  sendOrderStatusEmail: (email, name, order, newStatus, boutiqueName) => {
    const plainOrder = order && typeof order.get === "function" ? order.get({ plain: true }) : (order || {});
    return envoyerChangementStatut(email, { ...plainOrder, client: { nom: name } }, null, newStatus, boutiqueName);
  }
};
