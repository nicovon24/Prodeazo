import nodemailer from 'nodemailer'
import { env } from '../env'

if (!env.SMTP_USER || !env.SMTP_PASS) {
  console.warn('[email] SMTP_USER or SMTP_PASS not set — password reset emails will not be sent.')
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false, // STARTTLS
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  isFirstTime: boolean
): Promise<void> {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn(`[email] Skipping email to ${to} — SMTP not configured.`)
    return
  }

  const subject = isFirstTime
    ? 'Configurá tu contraseña en Prodeazo'
    : 'Restablecé tu contraseña en Prodeazo'

  const heading = isFirstTime
    ? '¡Configurá una contraseña!'
    : 'Restablecé tu contraseña'

  const bodyText = isFirstTime
    ? 'Recibimos una solicitud para configurar una contraseña en tu cuenta de Prodeazo. Hacé clic en el botón para crearla.'
    : 'Recibimos una solicitud para restablecer la contraseña de tu cuenta de Prodeazo. Hacé clic en el botón para cambiarla.'

  const ctaLabel = isFirstTime ? 'Configurar contraseña' : 'Restablecer contraseña'

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:480px;">
          <!-- Header -->
          <tr>
            <td style="background:#AFE805;padding:24px 32px;text-align:center;">
              <span style="font-size:1.5rem;font-weight:800;color:#000;letter-spacing:-0.5px;">PRODEAZO</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 12px;font-size:1.25rem;font-weight:700;color:#fff;">${heading}</h1>
              <p style="margin:0 0 28px;font-size:0.9rem;line-height:1.6;color:rgba(255,255,255,0.65);">
                ${bodyText}
              </p>
              <a href="${resetUrl}"
                style="display:inline-block;background:#AFE805;color:#000;font-weight:700;font-size:0.9rem;padding:14px 28px;border-radius:8px;text-decoration:none;">
                ${ctaLabel}
              </a>
              <p style="margin:28px 0 0;font-size:0.75rem;color:rgba(255,255,255,0.35);line-height:1.5;">
                Este link es válido por <strong style="color:rgba(255,255,255,0.5);">1 hora</strong> y solo puede usarse una vez.<br />
                Si no solicitaste este cambio, ignorá este email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:0.7rem;color:rgba(255,255,255,0.2);">
                Prodeazo · Copa Mundial FIFA 2026
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  await transporter.sendMail({
    from: `"Prodeazo" <${env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: `${bodyText}\n\nUsá este link (válido por 1 hora):\n${resetUrl}\n\nSi no solicitaste este cambio, ignorá este email.`,
  })
}
