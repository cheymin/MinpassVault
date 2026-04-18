let session = null
let serverUrl = ''

chrome.storage.local.get(['serverUrl', 'session', 'settings'], (result) => {
  if (result.serverUrl) serverUrl = result.serverUrl
  if (result.session) session = result.session
})

chrome.storage.onChanged.addListener((changes) => {
  if (changes.serverUrl) serverUrl = changes.serverUrl.newValue
  if (changes.session) session = changes.session.newValue
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CREDENTIALS') {
    getCredentialsForUrl(message.url).then(sendResponse)
    return true
  }
  
  if (message.type === 'SAVE_CREDENTIAL')') {
    saveCredential(message.data).then(sendResponse)
    return true
  }
  
  if (message.type === 'CHECK_SESSION') {
    checkSession().then(sendResponse)
    return true
  }
})

async function getCredentialsForUrl(url) {
  if (!session || !serverUrl) {
    return { success: false, error: 'Not logged in' }
  }
  
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    
    const response = await fetch(`${serverUrl}/api/vault/items`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
    })
    
    if (response.ok) {
      const data = await response.json()
      const items = (data.items || []).filter(item => {
        if (!item.data?.url) return false
        try {
          const itemUrl = new URL(item.data.url)
          return itemUrl.hostname === hostname
        } catch {
          return false
        }
      })
      
      return { success: true, items }
    }
    
    return { success: false, error: 'Failed to fetch credentials' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function saveCredential(data) {
  if (!session || !serverUrl) {
    return { success: false, error: 'Not logged in' }
  }
  
  try {
    const response = await fetch(`${serverUrl}/api/vault/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        type: 'login',
        name: data.name || new URL(data.url).hostname,
        data: {
          url: data.url,
          username: data.username,
          password: data.password,
        },
        folderId: null,
        favorite: false,
      }),
    })
    
    if (response.ok) {
      return { success: true }
    }
    
    return { success: false, error: 'Failed to save' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function checkSession() {
  if (!session || !serverUrl) {
    return { valid: false }
  }
  
  try {
    const response = await fetch(`${serverUrl}/api/session`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
    })
    
    return { valid: response.ok }
  } catch {
    return { valid: false }
  }
}

chrome.alarms.create('lockCheck', { periodInMinutes: 1 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'lockCheck') {
    const { settings, lastActivity } = await chrome.storage.local.get(['settings', 'lastActivity'])
    
    if (settings?.lockTimeout && lastActivity) {
      const timeout = settings.lockTimeout * 60 * 1000
      const now = Date.now()
      
      if (now - lastActivity > timeout) {
        await chrome.storage.local.remove(['session'])
        session = null
      }
    }
  }
})
