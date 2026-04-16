interface WebDAVConfig {
  url: string
  username: string
  password: string
}

export async function testWebDAVConnection(config: WebDAVConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/webdav/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: '连接失败' }
  }
}

export async function uploadToWebDAV(config: WebDAVConfig, filename: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/webdav/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, filename, content }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: '上传失败' }
  }
}

export async function downloadFromWebDAV(config: WebDAVConfig, filename: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const response = await fetch('/api/webdav/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, filename }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: '下载失败' }
  }
}
