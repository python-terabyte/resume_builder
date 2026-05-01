import { Resend } from 'resend'

function client() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = () => process.env.RESEND_FROM ?? 'BrandFox <onboarding@resend.dev>'

export async function sendPasswordResetCode(to: string, code: string) {
  const { error } = await client().emails.send({
    from: FROM(),
    to,
    subject: 'Your BrandFox password reset code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#150F23;border-radius:12px;color:#e8ddd0;">
        <h2 style="margin:0 0 8px;color:#C9A84C;font-size:20px;">Password Reset</h2>
        <p style="margin:0 0 24px;color:#9b8b7a;font-size:14px;">Enter the code below in BrandFox to reset your password. It expires in <strong style="color:#e8ddd0;">10 minutes</strong>.</p>
        <div style="text-align:center;padding:20px;background:#09070E;border-radius:8px;letter-spacing:12px;font-size:32px;font-weight:700;color:#C9A84C;">${code}</div>
        <p style="margin:20px 0 0;color:#9b8b7a;font-size:12px;">If you didn&apos;t request this, you can safely ignore this email.</p>
      </div>
    `,
  })
  if (error) throw new Error(error.message)
}

export async function sendContactMessage(name: string, email: string, message: string) {
  const to = process.env.CONTACT_EMAIL
  if (!to) throw new Error('CONTACT_EMAIL is not configured.')

  const { error } = await client().emails.send({
    from: FROM(),
    to,
    replyTo: email,
    subject: `BrandFox Contact: ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;background:#150F23;border-radius:12px;color:#e8ddd0;">
        <h2 style="margin:0 0 16px;color:#C9A84C;font-size:18px;">New Contact Message</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 12px 6px 0;color:#9b8b7a;white-space:nowrap;">From</td><td style="padding:6px 0;color:#e8ddd0;">${name}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#9b8b7a;white-space:nowrap;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#C9A84C;">${email}</a></td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#09070E;border-radius:8px;font-size:14px;line-height:1.6;color:#d4c4a0;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <p style="margin:16px 0 0;font-size:12px;color:#9b8b7a;">Reply directly to this email to respond to ${name}.</p>
      </div>
    `,
  })
  if (error) throw new Error(error.message)
}
