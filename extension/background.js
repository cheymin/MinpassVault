chrome.runtime.onInstalled.addListener(() => {
  console.log('SecureVault Extension installed')
  
  chrome.storage.local.get(['extensionPassword'], (result) => {
    if (!result.extensionPassword) {
      let hash = 0
      const password = 'admin'
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      chrome.storage.local.set({ extensionPassword: hash.toString(16) })
    }
  })
  
  chrome.storage.local.get(['autoSync'], (result) => {
    if (result.autoSync) {
      chrome.alarms.create('sync', { periodInMinutes: 60 })
    }
  })
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync') {
    await syncWithWebDAV()
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sync') {
    syncWithWebDAV()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }
})

async function syncWithWebDAV() {
  const config = await chrome.storage.local.get([
    'webdavUrl',
    'webdavUsername',
    'webdavPassword',
    'passwords',
    'totpItems'
  ])
  
  const { webdavUrl, webdavUsername, webdavPassword } = config
  
  if (!webdavUrl || !webdavUsername || !webdavPassword) {
    return { success: false, error: 'WebDAV未配置' }
  }
  
  try {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      passwords: config.passwords || [],
      totpItems: config.totpItems || []
    }
    
    const filename = `securevault-extension-${new Date().toISOString().split('T')[0]}.json`
    const uploadUrl = webdavUrl.endsWith('/') ? webdavUrl + filename : webdavUrl + '/' + filename
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + btoa(`${webdavUsername}:${webdavPassword}`),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backupData, null, 2)
    })
    
    if (response.ok || response.status === 201 || response.status === 204) {
      return { success: true }
    } else {
      return { success: false, error: `上传失败: ${response.status}` }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function downloadFromWebDAV() {
  const config = await chrome.storage.local.get([
    'webdavUrl',
    'webdavUsername',
    'webdavPassword'
  ])
  
  const { webdavUrl, webdavUsername, webdavPassword } = config
  
  if (!webdavUrl || !webdavUsername || !webdavPassword) {
    return { success: false, error: 'WebDAV未配置' }
  }
  
  try {
    const response = await fetch(webdavUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': 'Basic ' + btoa(`${webdavUsername}:${webdavPassword}`),
        'Depth': '1',
        'Content-Type': 'application/xml'
      },
      body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop></prop></propfind>'
    })
    
    if (response.ok || response.status === 207) {
      const text = await response.text()
      return { success: true, data: text }
    } else {
      return { success: false, error: `下载失败: ${response.status}` }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
