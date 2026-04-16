const DEFAULT_PASSWORD = 'admin'

function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

function showMessage(text, type = 'success') {
  const msg = document.getElementById('message')
  msg.textContent = text
  msg.className = `message ${type}`
  msg.classList.remove('hidden')
  setTimeout(() => msg.classList.add('hidden'), 3000)
}

async function loadSettings() {
  const result = await chrome.storage.local.get([
    'extensionPassword',
    'webdavUrl',
    'webdavUsername',
    'webdavPassword',
    'autoSync',
    'totpItems'
  ])
  
  if (result.webdavUrl) document.getElementById('webdavUrl').value = result.webdavUrl
  if (result.webdavUsername) document.getElementById('webdavUsername').value = result.webdavUsername
  if (result.webdavPassword) document.getElementById('webdavPassword').value = result.webdavPassword
  document.getElementById('autoSync').checked = result.autoSync || false
  
  renderTotpList(result.totpItems || [])
}

async function changePassword() {
  const current = document.getElementById('currentPassword').value
  const newPass = document.getElementById('newPassword').value
  const confirm = document.getElementById('confirmPassword').value
  
  if (!current || !newPass || !confirm) {
    showMessage('请填写所有字段', 'error')
    return
  }
  
  if (newPass !== confirm) {
    showMessage('两次输入的密码不一致', 'error')
    return
  }
  
  if (newPass.length < 4) {
    showMessage('密码至少需要4个字符', 'error')
    return
  }
  
  const result = await chrome.storage.local.get(['extensionPassword'])
  const storedPassword = result.extensionPassword || hashPassword(DEFAULT_PASSWORD)
  
  if (hashPassword(current) !== storedPassword) {
    showMessage('当前密码错误', 'error')
    return
  }
  
  await chrome.storage.local.set({ extensionPassword: hashPassword(newPass) })
  showMessage('密码修改成功')
  
  document.getElementById('currentPassword').value = ''
  document.getElementById('newPassword').value = ''
  document.getElementById('confirmPassword').value = ''
}

async function testWebdav() {
  const url = document.getElementById('webdavUrl').value
  const username = document.getElementById('webdavUsername').value
  const password = document.getElementById('webdavPassword').value
  
  if (!url || !username || !password) {
    showMessage('请填写完整的WebDAV配置', 'error')
    return
  }
  
  showMessage('正在测试连接...')
  
  try {
    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Depth': '0',
        'Content-Type': 'application/xml'
      },
      body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop></prop></propfind>'
    })
    
    if (response.ok || response.status === 207) {
      showMessage('连接成功！')
    } else {
      showMessage(`连接失败: ${response.status}`, 'error')
    }
  } catch (error) {
    showMessage('连接失败: ' + error.message, 'error')
  }
}

async function saveWebdav() {
  const url = document.getElementById('webdavUrl').value
  const username = document.getElementById('webdavUsername').value
  const password = document.getElementById('webdavPassword').value
  const autoSync = document.getElementById('autoSync').checked
  
  await chrome.storage.local.set({
    webdavUrl: url,
    webdavUsername: username,
    webdavPassword: password,
    autoSync
  })
  
  if (autoSync) {
    chrome.alarms.create('sync', { periodInMinutes: 60 })
  } else {
    chrome.alarms.clear('sync')
  }
  
  showMessage('WebDAV配置已保存')
}

async function syncNow() {
  showMessage('正在同步...')
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'sync' })
    if (response && response.success) {
      showMessage('同步成功！')
    } else {
      showMessage('同步失败: ' + (response?.error || '未知错误'), 'error')
    }
  } catch (error) {
    showMessage('同步失败: ' + error.message, 'error')
  }
}

async function addTotp() {
  const name = document.getElementById('totpName').value.trim()
  const secret = document.getElementById('totpSecret').value.trim().toUpperCase().replace(/\s/g, '')
  
  if (!name || !secret) {
    showMessage('请填写名称和密钥', 'error')
    return
  }
  
  const base32Regex = /^[A-Z2-7]+=*$/
  if (!base32Regex.test(secret)) {
    showMessage('密钥格式错误，应为Base32编码', 'error')
    return
  }
  
  const result = await chrome.storage.local.get(['totpItems'])
  const items = result.totpItems || []
  
  items.push({ name, secret, id: Date.now() })
  await chrome.storage.local.set({ totpItems: items })
  
  document.getElementById('totpName').value = ''
  document.getElementById('totpSecret').value = ''
  
  renderTotpList(items)
  showMessage('验证器添加成功')
}

async function deleteTotp(id) {
  const result = await chrome.storage.local.get(['totpItems'])
  const items = (result.totpItems || []).filter(item => item.id !== id)
  await chrome.storage.local.set({ totpItems: items })
  renderTotpList(items)
  showMessage('验证器已删除')
}

function renderTotpList(items) {
  const list = document.getElementById('totpList')
  
  if (!items || items.length === 0) {
    list.innerHTML = '<p style="color: #a1a1aa; font-size: 14px;">暂无验证器</p>'
    return
  }
  
  list.innerHTML = items.map(item => `
    <div class="totp-item">
      <div class="totp-info">
        <div class="totp-name">${item.name}</div>
        <div class="totp-secret">${item.secret.substring(0, 8)}...</div>
      </div>
      <button class="btn btn-danger" onclick="deleteTotp(${item.id})">删除</button>
    </div>
  `).join('')
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings()
  
  document.getElementById('changePasswordBtn').addEventListener('click', changePassword)
  document.getElementById('testWebdavBtn').addEventListener('click', testWebdav)
  document.getElementById('saveWebdavBtn').addEventListener('click', saveWebdav)
  document.getElementById('syncNowBtn').addEventListener('click', syncNow)
  document.getElementById('addTotpBtn').addEventListener('click', addTotp)
})

window.deleteTotp = deleteTotp
