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
    const { username, code } = body

    if (!username || !code) {
      return NextResponse.json(
        { error: '请提供用户名和验证码' },
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

    if (!user.verification_code || user.verification_code !== code) {
      return NextResponse.json(
        { error: '验证码错误' },
        { status: 400 }
      )
    }

    if (!user.verification_expires_at || new Date(user.verification_expires_at) < new Date()) {
      return NextResponse.json(
        { error: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '验证成功',
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}