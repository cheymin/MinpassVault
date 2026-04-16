let isUnlocked = false
let passwords = []
let totpItems = []
let sessionTimeout = null

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

async function getStoredPassword() {
  const result = await chrome.storage.local.get(['extensionPassword'])
  return result.extensionPassword || hashPassword(DEFAULT_PASSWORD)
}

async function setStoredPassword(password) {
  await chrome.storage.local.set({ extensionPassword: hashPassword(password) })
}

async function getPasswords() {
  const result = await chrome.storage.local.get(['passwords'])
  return result.passwords || []
}

async function setPasswords(data) {
  await chrome.storage.local.set({ passwords: data })
}

async function getTotpItems() {
  const result = await chrome.storage.local.get(['totpItems'])
  return result.totpItems || []
}

async function setTotpItems(data) {
  await chrome.storage.local.set({ totpItems: data })
}

function generateTotpCode(secret) {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let key = ''
  secret = secret.toUpperCase().replace(/\s/g, '')
  
  for (let i = 0; i < secret.length; i++) {
    const val = base32Chars.indexOf(secret[i])
    if (val === -1) continue
    key += val.toString(2).padStart(5, '0')
  }
  
  const time = Math.floor(Date.now() / 1000 / 30)
  const timeBytes = new ArrayBuffer(8)
  const timeView = new DataView(timeBytes)
  timeView.setUint32(4, time, false)
  
  let timeHex = ''
  const timeBytesArr = new Uint8Array(timeBytes)
  for (let i = 0; i < 8; i++) {
    timeHex += timeBytesArr[i].toString(16).padStart(2, '0')
  }
  
  const keyBytes = []
  for (let i = 0; i < key.length; i += 8) {
    keyBytes.push(parseInt(key.substr(i, 8), 2))
  }
  
  const hmacKey = keyBytes.slice(0, 64)
  while (hmacKey.length < 64) hmacKey.push(0)
  
  let code = 0
  for (let i = 0; i < Math.min(8, timeBytesArr.length); i++) {
    code = (code + timeBytesArr[i] * (i + 1)) % 1000000
  }
  for (let i = 0; i < hmacKey.length; i++) {
    code = (code + hmacKey[i] * (i + 1)) % 1000000
  }
  
  return code.toString().padStart(6, '0')
}

function getTimeRemaining() {
  const epoch = Math.floor(Date.now() / 1000)
  return 30 - (epoch % 30)
}

function updateTotpCodes() {
  totpItems.forEach((item, index) => {
    const codeEl = document.querySelector(`#totp-code-${index}`)
    if (codeEl) {
      codeEl.textContent = generateTotpCode(item.secret)
    }
  })
  
  const timerEls = document.querySelectorAll('.totp-timer .progress')
  const remaining = getTimeRemaining()
  const circumference = 2 * Math.PI * 15
  const offset = circumference * (1 - remaining / 30)
  
  timerEls.forEach(el => {
    el.style.strokeDashoffset = offset
  })
}

async function unlock() {
  const passwordInput = document.getElementById('masterPassword')
  const errorEl = document.getElementById('lockError')
  const password = passwordInput.value
  
  if (!password) {
    errorEl.textContent = '请输入密码'
    errorEl.classList.remove('hidden')
    return
  }
  
  const storedPassword = await getStoredPassword()
  
  if (hashPassword(password) === storedPassword) {
    isUnlocked = true
    document.getElementById('lockScreen').classList.add('hidden')
    document.getElementById('mainContent').classList.remove('hidden')
    errorEl.classList.add('hidden')
    passwordInput.value = ''
    
    await loadData()
    startSessionTimeout()
  } else {
    errorEl.textContent = '密码错误'
    errorEl.classList.remove('hidden')
    passwordInput.value = ''
  }
}

function lock() {
  isUnlocked = false
  document.getElementById('lockScreen').classList.remove('hidden')
  document.getElementById('mainContent').classList.add('hidden')
  clearTimeout(sessionTimeout)
}

function startSessionTimeout() {
  clearTimeout(sessionTimeout)
  sessionTimeout = setTimeout(lock, 5 * 60 * 1000)
}

async function loadData() {
  passwords = await getPasswords()
  totpItems = await getTotpItems()
  renderPasswords()
  renderTotpItems()
}

function renderPasswords(filter = '') {
  const list = document.getElementById('passwordList')
  const filtered = passwords.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.username?.toLowerCase().includes(filter.toLowerCase())
  )
  
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无密码数据</p>
        <p style="font-size: 12px; margin-top: 8px;">请先同步数据</p>
      </div>
    `
    return
  }
  
  list.innerHTML = filtered.map((item, index) => `
    <div class="item" data-index="${index}">
      <div class="item-icon">${item.name.charAt(0).toUpperCase()}</div>
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-username">${item.username || ''}</div>
      </div>
      <div class="item-actions">
        <button class="item-action-btn copy-user" data-index="${index}" title="复制用户名">👤</button>
        <button class="item-action-btn copy-pass" data-index="${index}" title="复制密码">🔑</button>
      </div>
    </div>
  `).join('')
  
  list.querySelectorAll('.copy-user').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const index = parseInt(btn.dataset.index)
      copyToClipboard(filtered[index].username)
    })
  })
  
  list.querySelectorAll('.copy-pass').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const index = parseInt(btn.dataset.index)
      copyToClipboard(filtered[index].password)
    })
  })
}

function renderTotpItems() {
  const list = document.getElementById('totpList')
  
  if (totpItems.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📱</div>
        <p>暂无验证器数据</p>
        <p style="font-size: 12px; margin-top: 8px;">请在设置中添加</p>
      </div>
    `
    return
  }
  
  const circumference = 2 * Math.PI * 15
  const remaining = getTimeRemaining()
  const offset = circumference * (1 - remaining / 30)
  
  list.innerHTML = totpItems.map((item, index) => `
    <div class="totp-item">
      <div class="totp-icon">${item.name.charAt(0).toUpperCase()}</div>
      <div class="totp-info">
        <div class="totp-name">${item.name}</div>
        <div class="totp-code" id="totp-code-${index}">${generateTotpCode(item.secret)}</div>
      </div>
      <div class="totp-timer">
        <svg width="36" height="36">
          <circle class="bg" cx="18" cy="18" r="15"></circle>
          <circle class="progress" cx="18" cy="18" r="15" 
            stroke-dasharray="${circumference}" 
            stroke-dashoffset="${offset}">
          </circle>
        </svg>
      </div>
      <button class="item-action-btn copy-totp" data-index="${index}" title="复制验证码">📋</button>
    </div>
  `).join('')
  
  list.querySelectorAll('.copy-totp').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index)
      const code = document.querySelector(`#totp-code-${index}`).textContent
      copyToClipboard(code)
    })
  })
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('已复制到剪贴板')
  })
}

function showNotification(message) {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    z-index: 1000;
  `
  notification.textContent = message
  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 2000)
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('unlockBtn').addEventListener('click', unlock)
  document.getElementById('masterPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') unlock()
  })
  
  document.getElementById('lockBtn').addEventListener('click', lock)
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })
  
  document.getElementById('syncBtn').addEventListener('click', async () => {
    showNotification('正在同步...')
    chrome.runtime.sendMessage({ action: 'sync' }, (response) => {
      if (response && response.success) {
        loadData()
        showNotification('同步成功')
      } else {
        showNotification('同步失败: ' + (response?.error || '未知错误'))
      }
    })
  })
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      
      const tabName = tab.dataset.tab
      document.getElementById('passwordsTab').classList.toggle('hidden', tabName !== 'passwords')
      document.getElementById('totpTab').classList.toggle('hidden', tabName !== 'totp')
    })
  })
  
  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderPasswords(e.target.value)
  })
  
  setInterval(updateTotpCodes, 1000)
})
