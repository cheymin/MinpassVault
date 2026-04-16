import { NextRequest, NextResponse } from 'next/server'

async function makeWebDAVRequest(url: string, username: string, password: string, method: string = 'PROPFIND', body?: string) {
  const headers: HeadersInit = {
    'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    'Depth': '0',
  }

  if (body) {
    headers['Content-Type'] = 'application/xml'
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  })

  return response
}

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

    const response = await makeWebDAVRequest(testUrl, username, password, 'PROPFIND', '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop></prop></propfind>')

    if (response.ok || response.status === 207) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: `连接失败: ${response.status}` })
    }
  } catch (error) {
    console.error('WebDAV test error:', error)
    return NextResponse.json({ success: false, error: '连接失败，请检查网络或配置' }, { status: 500 })
  }
}
