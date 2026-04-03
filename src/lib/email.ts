interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface EmailConfig {
  serviceType: 'smtp' | 'resend'
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPass?: string
  smtpFrom?: string
  resendApiKey?: string
  resendFrom?: string
}

let emailConfig: EmailConfig | null = null

export function configureEmail(config: EmailConfig) {
  emailConfig = config
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!emailConfig) {
    return { success: false, error: '邮件服务未配置' }
  }

  if (emailConfig.serviceType === 'resend') {
    return sendWithResend(options)
  } else {
    return sendWithSMTP(options)
  }
}

async function sendWithResend(options: SendEmailOptions): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!emailConfig?.resendApiKey) {
    return { success: false, error: 'Resend API Key 未配置' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailConfig.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailConfig.resendFrom || 'onboarding@resend.dev',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', data)
      return { success: false, error: data.message || '发送邮件失败' }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error instanceof Error ? error.message : '未知错误' }
  }
}

async function sendWithSMTP(options: SendEmailOptions): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!emailConfig?.smtpHost || !emailConfig?.smtpUser || !emailConfig?.smtpPass) {
    return { success: false, error: 'SMTP 配置不完整' }
  }

  try {
    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.default.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort || 587,
      secure: emailConfig.smtpSecure ?? false,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass,
      },
    })

    const info = await transporter.sendMail({
      from: emailConfig.smtpFrom || emailConfig.smtpUser,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })

    return { success: true, id: info.messageId }
  } catch (error) {
    console.error('SMTP send error:', error)
    return { success: false, error: error instanceof Error ? error.message : '发送邮件失败' }
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}