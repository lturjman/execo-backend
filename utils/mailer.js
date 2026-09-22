require('dotenv').config({ path: '.env.development' })
const { Resend } = require('resend')

const FROM = process.env.EMAIL_FROM || 'Execo <onboarding@resend.dev>'
const IS_PROD = process.env.NODE_ENV === 'production'
const ALLOWLIST = (process.env.EMAIL_ALLOWLIST || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

function getResendClient () {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY manquante')
  return new Resend(apiKey)
}

function buildResetEmail (email, resetUrl) {
  return {
    from: FROM,
    to: email,
    subject: 'Réinitialisation de votre mot de passe — Execo',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Réinitialisation de votre mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #7c3aed; color: #fff;
                    padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Définir un nouveau mot de passe
          </a>
        </p>
        <p>Ce lien est valable pendant 30 minutes.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `
  }
}

async function sendResetEmail (email, resetUrl) {
  if (ALLOWLIST.length > 0 && !ALLOWLIST.includes(email)) {
    console.log(`[mail] Email non autorisé, non envoyé à ${email}. Lien: ${resetUrl}`)
    return
  }

  if (!IS_PROD) {
    console.log(`[mail] Environnement hors production, email non envoyé. ${email}: ${resetUrl}`)
    return
  }

  const resend = getResendClient()
  await resend.emails.send(buildResetEmail(email, resetUrl))
}

module.exports = { sendResetEmail }
