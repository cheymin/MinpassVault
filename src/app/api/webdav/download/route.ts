import { NextRequest, NextResponse } from 'next/server'

async function downloadFromWebDAV(url: string, username: string, password: string, filename: string) {
  const fullUrl = url.endsWith('/') ? url + filename : url + '/' + filename
  
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    },
  })

  return response
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, username, password, filename } = body

    if (!url || !username || !password || !filename) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })
    }

    const response = await downloadFromWebDAV(url, username, password, filename)

    if (response.ok) {
      const data = await response.text()
      return NextResponse.json({ success: true, data })
    } else {
      return NextResponse.json({ success: false, error: `下载失败: ${response.status}` })
    }
  } catch (error) {
    console.error('WebDAV download error:', error)
    return NextResponse.json({ success: false, error: '下载失败' }, { status: 500 })
  }
}
