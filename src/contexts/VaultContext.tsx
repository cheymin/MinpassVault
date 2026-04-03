'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { encryptVaultData, decryptVaultData } from '@/lib/crypto'

export type VaultItemType = 'login' | 'secure_note' | 'card' | 'identity'

export interface LoginData {
  username: string
  password: string
  url: string
  notes: string
}

export interface SecureNoteData {
  content: string
}

export interface CardData {
  cardholderName: string
  cardNumber: string
  expiryDate: string
  cvv: string
  notes: string
}

export interface IdentityData {
  fullName: string
  email: string
  phone: string
  address: string
  notes: string
}

export interface VaultItem {
  id: string
  type: VaultItemType
  name: string
  data: LoginData | SecureNoteData | CardData | IdentityData
  folderId: string | null
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
}

interface VaultContextType {
  items: VaultItem[]
  folders: Folder[]
  loading: boolean
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ error: string | null }>
  updateItem: (id: string, updates: Partial<VaultItem>) => Promise<{ error: string | null }>
  deleteItem: (id: string) => Promise<{ error: string | null }>
  addFolder: (name: string) => Promise<{ error: string | null }>
  deleteFolder: (id: string) => Promise<{ error: string | null }>
  refreshVault: () => Promise<void>
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export function VaultProvider({ children }: { children: ReactNode }) {
  const { user, masterKey } = useAuth()
  const [items, setItems] = useState<VaultItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && masterKey) {
      refreshVault()
    } else {
      setItems([])
      setFolders([])
    }
  }, [user, masterKey])

  const refreshVault = async () => {
    if (!user || !masterKey) return

    setLoading(true)
    try {
      const { data: vaultData, error: vaultError } = await supabase
        .from('vault_items')
        .select('*')
        .eq('user_id', user.id)

      if (vaultError) throw vaultError

      const decryptedItems: VaultItem[] = []
      for (const item of vaultData || []) {
        try {
          const decryptedData = decryptVaultData<LoginData | SecureNoteData | CardData | IdentityData>(
            item.encrypted_data,
            masterKey
          )
          decryptedItems.push({
            id: item.id,
            type: item.type,
            name: item.name,
            data: decryptedData,
            folderId: item.folder_id,
            favorite: item.favorite,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          })
        } catch {
          console.error('Failed to decrypt item:', item.id)
        }
      }
      setItems(decryptedItems)

      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)

      if (folderError) throw folderError

      setFolders(
        (folderData || []).map((f) => ({
          id: f.id,
          name: f.name,
        }))
      )
    } catch (error) {
      console.error('Failed to load vault:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !masterKey) {
      return { error: 'Not authenticated' }
    }

    try {
      const encryptedData = encryptVaultData(item.data, masterKey)
      const { error } = await supabase.from('vault_items').insert({
        user_id: user.id,
        type: item.type,
        name: item.name,
        encrypted_data: encryptedData,
        folder_id: item.folderId,
        favorite: item.favorite,
      })

      if (error) throw error

      await refreshVault()
      return { error: null }
    } catch (error) {
      return { error: 'Failed to add item' }
    }
  }

  const updateItem = async (id: string, updates: Partial<VaultItem>) => {
    if (!user || !masterKey) {
      return { error: 'Not authenticated' }
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (updates.name) updateData.name = updates.name
      if (updates.folderId !== undefined) updateData.folder_id = updates.folderId
      if (updates.favorite !== undefined) updateData.favorite = updates.favorite
      if (updates.data) {
        updateData.encrypted_data = encryptVaultData(updates.data, masterKey)
      }

      const { error } = await supabase
        .from('vault_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await refreshVault()
      return { error: null }
    } catch (error) {
      return { error: 'Failed to update item' }
    }
  }

  const deleteItem = async (id: string) => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('vault_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await refreshVault()
      return { error: null }
    } catch (error) {
      return { error: 'Failed to delete item' }
    }
  }

  const addFolder = async (name: string) => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase.from('folders').insert({
        user_id: user.id,
        name,
      })

      if (error) throw error

      await refreshVault()
      return { error: null }
    } catch (error) {
      return { error: 'Failed to add folder' }
    }
  }

  const deleteFolder = async (id: string) => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      await supabase
        .from('vault_items')
        .update({ folder_id: null })
        .eq('folder_id', id)
        .eq('user_id', user.id)

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await refreshVault()
      return { error: null }
    } catch (error) {
      return { error: 'Failed to delete folder' }
    }
  }

  return (
    <VaultContext.Provider
      value={{
        items,
        folders,
        loading,
        addItem,
        updateItem,
        deleteItem,
        addFolder,
        deleteFolder,
        refreshVault,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const context = useContext(VaultContext)
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}
