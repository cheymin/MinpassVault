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
    const { userId, code } = body

    if (!userId || !code) {
      return NextResponse.json(
        { error: '请提供完整信息' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    if (!user.login_verification_code || user.login_verification_code !== code) {
      return NextResponse.json(
        { error: '验证码错误' },
        { status: 400 }
      )
    }

    if (!user.login_verification_expires_at || new Date(user.login_verification_expires_at) < new Date()) {
      return NextResponse.json(
        { error: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        login_verification_code: null,
        login_verification_expires_at: null,
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: '验证失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '验证成功',
    })
  } catch (error) {
    console.error('Verify login code error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
