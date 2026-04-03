import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { configureEmail, sendEmail, generateVerificationCode } from '@/lib/email'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseKey)
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  
  const [localPart, domain] = email.split('@')
  const maskedLocal = localPart.length > 1 
    ? localPart[0] + '***' + (localPart.length > 2 ? localPart[localPart.length - 1] : '')
    : localPart
  
  return `${maskedLocal}@${domain}`
}

function createVerificationEmail(code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; text-align: center;">
        <h1 style="color: #3b82f6; margin-bottom: 20px;">SecureVault</h1>
        <p style="color: #9ca3af; margin-bottom: 30px;">您的密码重置验证码</p>
        <div style="background: #2a2a4a; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <span style="font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">验证码有效期为10分钟</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">如果您没有请求重置密码，请忽略此邮件</p>
      </div>
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, username } = body

    if (!type || !username) {
      return NextResponse.json(
        { error: '请提供用户名' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .limit(1)

    if (userError || !users || users.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    const user = users[0]

    if (!user.email) {
      return NextResponse.json(
        { error: '该用户未设置邮箱，无法重置密码' },
        { status: 400 }
      )
    }

    const emailServiceType = user.email_service_type || 'smtp'
    
    if (emailServiceType === 'smtp') {
      if (!user.smtp_host || !user.smtp_user || !user.smtp_pass) {
        return NextResponse.json(
          { error: 'SMTP 邮件服务未配置，请在设置中配置 SMTP' },
          { status: 500 }
        )
      }
      configureEmail({
        serviceType: 'smtp',
        smtpHost: user.smtp_host,
        smtpPort: user.smtp_port,
        smtpSecure: user.smtp_secure,
        smtpUser: user.smtp_user,
        smtpPass: user.smtp_pass,
        smtpFrom: user.smtp_from,
      })
    } else {
      if (!user.resend_api_key) {
        return NextResponse.json(
          { error: 'Resend 邮件服务未配置，请在设置中配置 Resend API Key' },
          { status: 500 }
        )
      }
      configureEmail({
        serviceType: 'resend',
        resendApiKey: user.resend_api_key,
        resendFrom: user.resend_from,
      })
    }

    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_code: code,
        verification_expires_at: expiresAt,
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: '保存验证码失败' },
        { status: 500 }
      )
    }

    const emailHtml = createVerificationEmail(code)
    const result = await sendEmail({
      to: user.email,
      subject: 'SecureVault - 密码重置验证码',
      html: emailHtml,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: '发送邮件失败: ' + (result.error || '未知错误') },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      maskedEmail: maskEmail(user.email),
    })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}