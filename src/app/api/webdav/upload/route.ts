import { NextRequest, NextResponse } from 'next/server'

async function uploadToWebDAV(url: string, username: string, password: string, filename: string, content: string) {
  const fullUrl = url.endsWith('/') ? url + filename : url + '/' + filename
  
  const response = await fetch(fullUrl, {
    method: 'PUT',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: content,
  })

  return response
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, username, password, filename, content } = body

    if (!url || !username || !password || !filename || !content) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })
    }

    const response = await uploadToWebDAV(url, username, password, filename, content)

    if (response.ok || response.status === 201 || response.status === 204) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: `上传失败: ${response.status}` })
    }
  } catch (error) {
    console.error('WebDAV upload error:', error)
    return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 })
  }
}
