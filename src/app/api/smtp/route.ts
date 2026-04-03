import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const {
      emailServiceType,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      smtpFrom,
      resendApiKey,
      resendFrom,
      userId,
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('users')
      .update({
        email_service_type: emailServiceType || 'smtp',
        smtp_host: smtpHost || null,
        smtp_port: smtpPort || null,
        smtp_secure: smtpSecure ?? true,
        smtp_user: smtpUser || null,
        smtp_pass: smtpPass || null,
        smtp_from: smtpFrom || null,
        resend_api_key: resendApiKey || null,
        resend_from: resendFrom || null,
      })
      .eq('id', userId)

    if (error) {
      return NextResponse.json(
        { error: '保存邮件配置失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '邮件配置已保存',
    })
  } catch (error) {
    console.error('Email config error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('users')
      .select('email_service_type, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from, resend_api_key, resend_from')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: '获取邮件配置失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      config: data,
    })
  } catch (error) {
    console.error('Get email config error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}