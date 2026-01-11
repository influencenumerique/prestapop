import { Resend } from 'resend'

const FROM_EMAIL = 'PrestaPop <noreply@prestapop.com>'

// Lazy initialization to avoid build errors when API key is not set
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

// ============ CONTACT EMAIL (Admin → User) ============

interface ContactEmailParams {
  to: string
  userName: string
  subject: string
  message: string
}

export async function sendContactEmail({ to, userName, subject, message }: ContactEmailParams) {
  const resend = getResendClient()

  // Si pas de clé API, log seulement (dev mode)
  if (!resend) {
    console.log('[EMAIL] Contact email (dev mode):')
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Message: ${message}`)
    return { success: true, id: 'dev-mode' }
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">PrestaPop</h2>
        <p>Bonjour ${userName},</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Cet email a été envoyé par l'équipe PrestaPop.<br>
          Si vous avez des questions, répondez directement à cet email.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[EMAIL] Error sending contact email:', error)
    throw new Error(error.message)
  }

  return { success: true, id: data?.id }
}

// ============ MISSION VALIDATED EMAIL ============

interface MissionValidatedEmailParams {
  to: string
  userName: string
  missionTitle: string
  missionDate: string
  missionSector: string
  dayRate: string
}

export async function sendMissionValidatedEmail({
  to,
  userName,
  missionTitle,
  missionDate,
  missionSector,
  dayRate,
}: MissionValidatedEmailParams) {
  const resend = getResendClient()

  if (!resend) {
    console.log('[EMAIL] Mission validated (dev mode):')
    console.log(`  To: ${to}`)
    console.log(`  Mission: ${missionTitle}`)
    return { success: true, id: 'dev-mode' }
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Mission validée - ${missionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Mission Validée</h2>
        <p>Bonjour ${userName},</p>
        <p>Votre mission a été validée et est maintenant confirmée :</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Mission :</strong> ${missionTitle}</p>
          <p><strong>Date :</strong> ${missionDate}</p>
          <p><strong>Secteur :</strong> ${missionSector}</p>
          <p><strong>Tarif :</strong> ${dayRate}</p>
        </div>
        <p>Connectez-vous à votre espace pour voir les détails complets.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 14px;">Équipe PrestaPop</p>
      </div>
    `,
  })

  if (error) {
    console.error('[EMAIL] Error sending mission validated email:', error)
    throw new Error(error.message)
  }

  return { success: true, id: data?.id }
}

// ============ USER SUSPENDED EMAIL ============

interface UserSuspendedEmailParams {
  to: string
  userName: string
  reason?: string
}

export async function sendUserSuspendedEmail({ to, userName, reason }: UserSuspendedEmailParams) {
  const resend = getResendClient()

  if (!resend) {
    console.log('[EMAIL] User suspended (dev mode):')
    console.log(`  To: ${to}`)
    console.log(`  Reason: ${reason || 'Non spécifié'}`)
    return { success: true, id: 'dev-mode' }
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Compte suspendu - PrestaPop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Compte Suspendu</h2>
        <p>Bonjour ${userName},</p>
        <p>Votre compte PrestaPop a été suspendu.</p>
        ${reason ? `
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
            <p><strong>Motif :</strong> ${reason}</p>
          </div>
        ` : ''}
        <p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 14px;">Équipe PrestaPop</p>
      </div>
    `,
  })

  if (error) {
    console.error('[EMAIL] Error sending user suspended email:', error)
    throw new Error(error.message)
  }

  return { success: true, id: data?.id }
}

// ============ NEW APPLICATION EMAIL ============

interface NewApplicationEmailParams {
  to: string
  companyName: string
  driverName: string
  missionTitle: string
  missionDate: string
}

export async function sendNewApplicationEmail({
  to,
  companyName,
  driverName,
  missionTitle,
  missionDate,
}: NewApplicationEmailParams) {
  const resend = getResendClient()

  if (!resend) {
    console.log('[EMAIL] New application (dev mode):')
    console.log(`  To: ${to}`)
    console.log(`  Driver: ${driverName}`)
    console.log(`  Mission: ${missionTitle}`)
    return { success: true, id: 'dev-mode' }
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Nouvelle candidature - ${missionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Nouvelle Candidature</h2>
        <p>Bonjour ${companyName},</p>
        <p>Vous avez reçu une nouvelle candidature pour votre mission :</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Mission :</strong> ${missionTitle}</p>
          <p><strong>Date :</strong> ${missionDate}</p>
          <p><strong>Candidat :</strong> ${driverName}</p>
        </div>
        <p>Connectez-vous à votre espace pour consulter le profil du candidat et accepter ou refuser sa candidature.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 14px;">Équipe PrestaPop</p>
      </div>
    `,
  })

  if (error) {
    console.error('[EMAIL] Error sending new application email:', error)
    throw new Error(error.message)
  }

  return { success: true, id: data?.id }
}
