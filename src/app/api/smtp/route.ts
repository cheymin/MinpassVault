import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { host, port, secure, user, pass, from } = body

    if (!host || !port || !user || !pass || !from) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const envContent = `
# SMTP 邮件配置
SMTP_HOST=${host}
SMTP_PORT=${port}
SMTP_SECURE=${secure}
SMTP_USER=${user}
SMTP_PASS=${pass}
SMTP_FROM=${from}
`

    return NextResponse.json({
      success: true,
      message: 'SMTP 配置已保存',
      envContent,
    })
  } catch (error) {
    console.error('SMTP config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}