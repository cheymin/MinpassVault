import { supabase } from './supabase'

export async function checkInitialized(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error checking initialization:', error)
      return false
    }

    return (count ?? 0) > 0
  } catch (err) {
    console.error('Error checking initialization:', err)
    return false
  }
}

export async function resetDatabase(): Promise<{ error: string | null }> {
  try {
    const { error: vaultError } = await supabase
      .from('vault_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (vaultError) {
      return { error: vaultError.message }
    }

    const { error: foldersError } = await supabase
      .from('folders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (foldersError) {
      return { error: foldersError.message }
    }

    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (usersError) {
      return { error: usersError.message }
    }

    localStorage.removeItem('user')
    localStorage.removeItem('masterKey')

    return { error: null }
  } catch (err) {
    return { error: '重置数据库失败' }
  }
}
