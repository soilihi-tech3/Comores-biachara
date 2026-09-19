require("dotenv").config();
const nodemailer = require("nodemailer");
const dns = require("dns");

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

function getTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASS || process.env.GMAIL_PASS;

  if (gmailUser && gmailPass) {
    const cleanPass = gmailPass.replace(/\s+/g, "").trim();
    return nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      family: 4,
      auth: {
        user: gmailUser.trim(),
        pass: cleanPass,
      },
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      family: 4,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

async function sendMail({ to, subject, html }) {
  if (!to) return;
  
  const transporter = getTransporter();
  const fromEmail = process.env.EMAIL_FROM || (process.env.GMAIL_USER ? `"Marché Vert" <${process.env.GMAIL_USER.trim()}>` : '"Marché Vert" <no-reply@marchevert.com>');

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });
      console.log(`✉️ [EMAIL GMAIL ENVOYÉ RÉELLEMENT] à ${to} : "${subject}"`);
      return true;
    } catch (err) {
      console.error(`❌ [EMAIL ERROR] Échec de l'envoi SMTP/Gmail à ${to} :`, err.message);
    }
  }

  // Fallback Dev / Console Logging
  console.log("\n=================== ✉️ EMAIL TRANSACTIONNEL (DEV LOG) ===================");
  console.log(`Destinataire : ${to}`);
  console.log(`Sujet        : ${subject}`);
  console.log("--------------------------------------------------------------------------");
  console.log(html.replace(/<[^>]*>?/gm, " ")); // Plain text preview
  console.log("==========================================================================\n");
  return true;
}

/**
 * 1. Envoi du code de vérification OTP par Email
 */
async function sendOtpEmail(email, name, otpCode) {
  const subject = `${otpCode} est votre code de vérification — Marché Vert`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F6F4; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background-color: #163424; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
        .body { padding: 32px 28px; color: #2D3748; line-height: 1.6; }
        .otp-box { background: #EBF7F0; border: 2px dashed #2D8653; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #163424; margin: 0; }
        .footer { font-size: 12px; color: #A0AEC0; text-align: center; padding: 20px; border-top: 1px solid #EDF2F7; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Marché Vert</h1>
        </div>
        <div class="body">
          <h2 style="font-size: 18px; color: #163424; margin-top: 0;">Bonjour ${name || 'cher client'},</h2>
          <p>Merci de créer votre compte. Pour finaliser votre inscription et sécuriser votre compte, veuillez utiliser le code de vérification ci-dessous :</p>

          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>

          <p style="font-size: 13px; color: #718096; text-align: center;">Ce code est valide pendant <strong>15 minutes</strong>. Ne le partagez avec personne.</p>
        </div>
        <div class="footer">
          &copy; 2026 Marché Vert. Tous droits réservés.
        </div>
      </div>
    </body>
    </html>
  `;
  return sendMail({ to: email, subject, html });
}

/**
 * 2. Envoi de la confirmation de commande au client
 */
async function sendOrderConfirmationEmail(email, name, order, boutiqueName = "Marché Vert") {
  const cmdNum = "COM-B" + String(order.id).padStart(3, "0");
  const subject = `Confirmation de votre commande #${cmdNum} — ${boutiqueName}`;

  const itemsListHtml = (order.items || []).map(it => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7;">${it.product?.nom || 'Produit'}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; text-align: center;">x${it.quantite}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #EDF2F7; text-align: right; font-weight: 700;">${Number(it.prixUnitaire * it.quantite).toLocaleString('fr-FR')} €</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F6F4; margin: 0; padding: 20px; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background-color: #163424; padding: 24px; text-align: center; color: #ffffff; }
        .body { padding: 32px 28px; color: #2D3748; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total-box { background: #163424; color: #ffffff; padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 20px; }
        .footer { font-size: 12px; color: #A0AEC0; text-align: center; padding: 20px; border-top: 1px solid #EDF2F7; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 style="margin:0; font-size:22px;">${boutiqueName}</h1>
        </div>
        <div class="body">
          <h2 style="color: #163424; font-size: 18px; margin-top:0;">Commande #${cmdNum} Enregistrée !</h2>
          <p>Bonjour ${name || 'cher client'}, nous avons bien reçu votre commande et nous la traitons actuellement.</p>

          <table class="summary-table">
            <thead>
              <tr style="border-bottom: 2px solid #E2E8F0; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">
                <th style="padding-bottom: 8px;">Article</th>
                <th style="padding-bottom: 8px; text-align: center;">Qté</th>
                <th style="padding-bottom: 8px; text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>

          <div style="font-size: 14px; margin-top: 10px; color: #4A5568;">
            <div><strong>Mode de livraison :</strong> ${order.modeLivraison === 'domicile' ? 'Livraison à domicile' : 'Retrait en boutique'}</div>
            <div><strong>Moyen de paiement :</strong> ${order.moyenPaiement || 'Cash'}</div>
          </div>

          <div class="total-box">
            <span>TOTAL RÉGLÉ :</span>
            <span>${Number(order.total).toLocaleString('fr-FR')} €</span>
          </div>
        </div>
        <div class="footer">
          Merci pour votre confiance · &copy; 2026 ${boutiqueName}
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({ to: email, subject, html });
}

/**
 * 3. Notification de changement de statut de commande
 */
async function sendOrderStatusEmail(email, name, order, newStatus, boutiqueName = "Marché Vert") {
  const cmdNum = "COM-B" + String(order.id).padStart(3, "0");
  
  const statusLabels = {
    validee: "Confirmée",
    pret_retrait: "Prête à récupérer en boutique",
    en_livraison: "En cours de livraison",
    recuperee: "Récupérée",
    livree: "Livrée",
    annulee: "Annulée"
  };

  const statusTitle = statusLabels[newStatus] || newStatus;
  const subject = `Mise à jour commande #${cmdNum} : ${statusTitle} — ${boutiqueName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F6F4; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background-color: #163424; padding: 24px; text-align: center; color: #ffffff; }
        .body { padding: 32px 28px; color: #2D3748; line-height: 1.6; }
        .status-badge { background: #EBF7F0; border: 1px solid #2D8653; color: #163424; padding: 12px; border-radius: 10px; font-weight: bold; text-align: center; font-size: 16px; margin: 20px 0; }
        .footer { font-size: 12px; color: #A0AEC0; text-align: center; padding: 20px; border-top: 1px solid #EDF2F7; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 style="margin:0; font-size:22px;">${boutiqueName}</h1>
        </div>
        <div class="body">
          <h2 style="font-size: 18px; color: #163424; margin-top:0;">Bonjour ${name || 'cher client'},</h2>
          <p>Le statut de votre commande <strong>#${cmdNum}</strong> a été mis à jour :</p>

          <div class="status-badge">
            Nouveau statut : ${statusTitle}
          </div>

          <p>Vous pouvez consulter les détails et le suivi en temps réel sur votre espace client.</p>
        </div>
        <div class="footer">
          &copy; 2026 ${boutiqueName}
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({ to: email, subject, html });
}

module.exports = {
  sendMail,
  sendOtpEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
};
