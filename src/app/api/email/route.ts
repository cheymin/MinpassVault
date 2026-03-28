import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createEmailTransporter, sendEmail, generateVerificationCode, createVerificationEmail, createPasswordResetEmail } from '@/lib/email'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, email, username } = body

    if (!type || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const emailConfig = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    }

    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    createEmailTransporter(emailConfig)

    if (type === 'verification') {
      const supabase = getSupabaseClient()
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${email},username.eq.${email}`)
        .limit(1)

      if (userError || !users || users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const user = users[0]
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
          { error: 'Failed to save verification code' },
          { status: 500 }
        )
      }

      const emailHtml = createVerificationEmail(code)
      const result = await sendEmail({
        to: email,
        subject: 'SecureVault - 邮箱验证',
        html: emailHtml,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully',
      })
    } else if (type === 'reset') {
      const supabase = getSupabaseClient()
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${email},username.eq.${email}`)
        .limit(1)

      if (userError || !users || users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const user = users[0]
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

      const { error: updateError } = await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          reset_expires_at: expiresAt,
        })
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to save reset token' },
          { status: 500 }
        )
      }

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      const emailHtml = createPasswordResetEmail(resetLink)
      const result = await sendEmail({
        to: email,
        subject: 'SecureVault - 重置密码',
        html: emailHtml,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully',
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}