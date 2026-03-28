import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

let transporter: nodemailer.Transporter | null = null

export function createEmailTransporter(config: EmailConfig) {
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  })
}

export async function sendEmail(options: SendEmailOptions) {
  if (!transporter) {
    throw new Error('Email transporter not initialized')
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@securevault.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function createVerificationEmail(code: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #0f0f0f;
          color: #ffffff;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #ffffff;
        }
        .content {
          padding: 30px;
        }
        .code {
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          color: #ffffff;
          font-size: 32px;
          font-weight: bold;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          letter-spacing: 4px;
          margin: 20px 0;
        }
        .footer {
          background: #1a1a1a;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 SecureVault</div>
        </div>
        <div class="content">
          <h2 style="margin: 0 0 20px 0;">验证您的邮箱</h2>
          <p style="color: #9ca3af; margin: 0 0 20px 0;">
            感谢您使用 SecureVault。请使用以下验证码完成验证：
          </p>
          <div class="code">${code}</div>
          <p style="color: #9ca3af; margin: 0;">
            此验证码将在 10 分钟后过期。如果您没有请求此验证码，请忽略此邮件。
          </p>
        </div>
        <div class="footer">
          <p>© 2026 SecureVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function createPasswordResetEmail(resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #0f0f0f;
          color: #ffffff;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #ffffff;
        }
        .content {
          padding: 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          background: #1a1a1a;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 SecureVault</div>
        </div>
        <div class="content">
          <h2 style="margin: 0 0 20px 0;">重置您的密码</h2>
          <p style="color: #9ca3af; margin: 0 0 20px 0;">
            我们收到了重置您账户密码的请求。如果这是您发起的，请点击下面的按钮重置密码：
          </p>
          <a href="${resetLink}" class="button">重置密码</a>
          <p style="color: #9ca3af; margin: 20px 0 0 0;">
            此链接将在 30 分钟后过期。如果您没有请求重置密码，请忽略此邮件。
          </p>
        </div>
        <div class="footer">
          <p>© 2026 SecureVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}