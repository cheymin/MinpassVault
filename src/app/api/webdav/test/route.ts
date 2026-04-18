import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, username, password } = body

    if (!url || !username || !password) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })
    }

    let testUrl = url
    if (!testUrl.endsWith('/')) {
      testUrl += '/'
    }

    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    
    const response = await fetch(testUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Depth': '0',
        'Content-Type': 'application/xml',
      },
      body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop></prop></propfind>',
    })

    if (response.ok || response.status === 207) {
      return NextResponse.json({ success: true })
    } else if (response.status === 401) {
      return NextResponse.json({ success: false, error: '认证失败，请检查用户名和密码' })
    } else if (response.status === 404) {
      return NextResponse.json({ success: false, error: 'WebDAV 地址不存在' })
    } else {
      return NextResponse.json({ success: false, error: `连接失败: HTTP ${response.status}` })
    }
  } catch (error: any) {
    console.error('WebDAV test error:', error)
    
    if (error.cause?.code === 'ENOTFOUND') {
      return NextResponse.json({ success: false, error: '无法解析域名，请检查地址' })
    }
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({ success: false, error: '连接被拒绝，请检查端口或服务器状态' })
    }
    if (error.cause?.code === 'ETIMEDOUT') {
      return NextResponse.json({ success: false, error: '连接超时，请检查网络' })
    }
    
    return NextResponse.json({ success: false, error: error.message || '连接失败，请检查配置' })
  }
}
