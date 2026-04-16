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
    const { userId, webdavUrl, webdavUsername, webdavPassword } = body

    if (!userId || !webdavUrl || !webdavUsername || !webdavPassword) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    const { data: items, error: itemsError } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', userId)

    if (itemsError) {
      return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('site_title, site_icon, email')
      .eq('id', userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
    }

    const backupData = {
      version: '2.3',
      exportedAt: new Date().toISOString(),
      user: {
        siteTitle: user?.site_title,
        siteIcon: user?.site_icon,
        email: user?.email,
      },
      items: items.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        encrypted_data: item.encrypted_data,
        favorite: item.favorite,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
    }

    const filename = `securevault-backup-${new Date().toISOString().split('T')[0]}.json`
    const content = JSON.stringify(backupData, null, 2)

    const response = await uploadToWebDAV(webdavUrl, webdavUsername, webdavPassword, filename, content)

    if (response.ok || response.status === 201 || response.status === 204) {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'backup_create',
        resource_type: 'backup',
        details: { filename, itemCount: items.length },
      })

      return NextResponse.json({ success: true, filename })
    } else {
      return NextResponse.json({ error: `备份失败: ${response.status}` }, { status: 500 })
    }
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: '备份失败' }, { status: 500 })
  }
}
