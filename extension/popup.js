let serverUrl = ''
let session = null

const loginView = document.getElementById('login-view')
const mainView = document.getElementById('main-view')
const addView = document.getElementById('add-view')
const settingsView = document.getElementById('settings-view')

const serverUrlInput = document.getElementById('server-url')
const usernameInput = document.getElementById('username')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('login-btn')
const loginError = document.getElementById('login-error')

const searchInput = document.getElementById('search-input')
const passwordsList = document.getElementById('passwords-list')
const logoutBtn = document.getElementById('logout-btn')
const addPasswordBtn = document.getElementById('add-password-btn')
const settingsBtn = document.getElementById('settings-btn')

const backBtn = document.getElementById('back-btn')
const itemNameInput = document.getElementById('item-name')
const itemUrlInput = document.getElementById('item-url')
const itemUsernameInput = document.getElementById('item-username')
const itemPasswordInput = document.getElementById('item-password')
const togglePasswordBtn = document.getElementById('toggle-password')
const generateBtn = document.getElementById('generate-btn')
const savePasswordBtn = document.getElementById('save-password-btn')
const saveError = document.getElementById('save-error')

const backSettingsBtn = document.getElementById('back-settings-btn')
const autoFillToggle = document.getElementById('auto-fill-toggle')
const autoSaveToggle = document.getElementById('auto-save-toggle')
const lockTimeoutInput = document.getElementById('lock-timeout')
const clearDataBtn = document.getElementById('clear-data-btn')

async function init() {
  const stored = await chrome.storage.local.get(['serverUrl', 'session', 'settings'])
  
  if (stored.serverUrl) {
    serverUrlInput.value = stored.serverUrl
    serverUrl = stored.serverUrl
  }
  
  if (stored.session) {
    session = stored.session
    await checkSession()
  }
  
  if (stored.settings) {
    autoFillToggle.checked = stored.settings.autoFill !== false
    autoSaveToggle.checked = stored.settings.autoSave !== false
    lockTimeoutInput.value = stored.settings.lockTimeout || 30
  }
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.url) {
    itemUrlInput.value = tab.url
    const url = new URL(tab.url)
    itemNameInput.value = url.hostname.replace('www.', '')
  }
}

async function checkSession() {
  if (!session || !serverUrl) {
    showView('login')
    return
  }
  
  try {
    const response = await fetch(`${serverUrl}/api/session`, {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    })
    
    if (response.ok) {
      showView('main')
      await loadPasswords()
    } else {
      session = null
      await chrome.storage.local.remove(['session'])
      showView('login')
    }
  } catch (error) {
    console.error('Session check failed:', error)
    showView('login')
  }
}

async function login() {
  const server = serverUrlInput.value.trim().replace(/\/$/, '')
  const username = usernameInput.value.trim()
  const password = passwordInput.value
  
  if (!server || !username || !password) {
    showError(loginError, 'Please fill in all fields')
    return
  }
  
  loginBtn.disabled = true
  loginBtn.textContent = 'Logging in...'
  
  try {
    const response = await fetch(`${server}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    
    const data = await response.json()
    
    if (response.ok && data.token) {
      serverUrl = server
      session = { token: data.token, user: data.user }
      
      await chrome.storage.local.set({
        serverUrl: server,
        session: session,
      })
      
      passwordInput.value = ''
      hideError(loginError)
      showView('main')
      await loadPasswords()
    } else {
      showError(loginError, data.error || 'Login failed')
    }
  } catch (error) {
    showError(loginError, '连接失败，请检查服务器地址')
  } finally {
    loginBtn.disabled = false
    loginBtn.textContent = 'Login'
  }
}

async function loadPasswords() {
  if (!session || !serverUrl) return
  
  passwordsList.innerHTML = '<div class="empty-state"><p>Loading...</p></div>'
  
  try {
    const response = await fetch(`${serverUrl}/api/vault/items`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
    })
    
    if (response.ok) {
      const data = await response.json()
      renderPasswords(data.items || [])
    } else {
      passwordsList.innerHTML = '<div class="empty-state"><p>Failed to load passwords</p></div>'
    }
  } catch (error) {
    passwordsList.innerHTML = '<div class="empty-state"><p>Connection error</p></div>'
  }
}

function renderPasswords(items) {
  if (!items || items.length === 0) {
    passwordsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p>No passwords saved yet</p>
      </div>
    `
    return
  }
  
  passwordsList.innerHTML = items.map(item => `
    <div class="password-item" data-id="${item.id}">
      <div class="icon">${item.name.charAt(0).toUpperCase()}</div>
      <div class="info">
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="username">${escapeHtml(item.data?.username || '')}</div>
      </div>
      <div class="actions">
        <button class="copy-btn" data-field="username" title="Copy username">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
        <button class="copy-btn" data-field="password" title="Copy password">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('')
  
  passwordsList.querySelectorAll('.password-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.actions')) {
        autofill(item.dataset.id)
      }
    })
  })
  
  passwordsList.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const item = btn.closest('.password-item')
      copyField(item.dataset.id, btn.dataset.field)
    })
  })
}

async function autofill(itemId) {
  if (!session || !serverUrl) return
  
  try {
    const response = await fetch(`${serverUrl}/api/vault/items/${itemId}`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
    })
    
    if (response.ok) {
      const data = await response.json()
      const item = data.item
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (tab) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (username, password) => {
            const inputs = document.querySelectorAll('input')
            let usernameField = null
            let passwordField = null
            
            inputs.forEach(input => {
              const type = input.type?.toLowerCase()
              const name = (input.name || input.id || '').toLowerCase()
              const placeholder = (input.placeholder || '').toLowerCase()
              
              if (type === 'password') {
                passwordField = input
              } else if (type === 'text' || type === 'email') {
                if (name.includes('user') || name.includes('email') || name.includes('login') ||
                    placeholder.includes('user') || placeholder.includes('email') || placeholder.includes('login')) {
                  usernameField = input
                }
              }
            })
            
            if (usernameField) {
              usernameField.value = username
              usernameField.dispatchEvent(new Event('input', { bubbles: true }))
            }
            
            if (passwordField) {
              passwordField.value = password
              passwordField.dispatchEvent(new Event('input', { bubbles: true }))
            }
          },
          args: [item.data?.username || '', item.data?.password || ''],
        })
        
        window.close()
      }
    }
  } catch (error) {
    console.error('Autofill failed:', error)
  }
}

async function copyField(itemId, field) {
  if (!session || !serverUrl) return
  
  try {
    const response = await fetch(`${serverUrl}/api/vault/items/${itemId}`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
    })
    
    if (response.ok) {
      const data = await response.json()
      const value = field === 'username' ? data.item.data?.username : data.item.data?.password
      
      if (value) {
        await navigator.clipboard.writeText(value)
        showToast('Copied to clipboard')
      }
    }
  } catch (error) {
    console.error('Copy failed:', error)
  }
}

async function savePassword() {
  const name = itemNameInput.value.trim()
  const url = itemUrlInput.value.trim()
  const username = itemUsernameInput.value.trim()
  const password = itemPasswordInput.value
  
  if (!name || !password) {
    showError(saveError, 'Name and password are required')
    return
  }
  
  if (!session || !serverUrl) {
    showError(saveError, 'Not logged in')
    return
  }
  
  savePasswordBtn.disabled = true
  savePasswordBtn.textContent = 'Saving...'
  
  try {
    const response = await fetch(`${serverUrl}/api/vault/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        type: 'login',
        name,
        data: { url, username, password },
        folderId: null,
        favorite: false,
      }),
    })
    
    if (response.ok) {
      hideError(saveError)
      clearAddForm()
      showView('main')
      await loadPasswords()
    } else {
      const data = await response.json()
      showError(saveError, data.error || 'Failed to save')
    }
  } catch (error) {
    showError(saveError, 'Connection error')
  } finally {
    savePasswordBtn.disabled = false
    savePasswordBtn.textContent = 'Save'
  }
}

function generatePassword() {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  itemPasswordInput.value = password
  itemPasswordInput.type = 'text'
}

function clearAddForm() {
  itemNameInput.value = ''
  itemUrlInput.value = ''
  itemUsernameInput.value = ''
  itemPasswordInput.value = ''
}

async function logout() {
  session = null
  await chrome.storage.local.remove(['session'])
  showView('login')
}

async function saveSettings() {
  await chrome.storage.local.set({
    settings: {
      autoFill: autoFillToggle.checked,
      autoSave: autoSaveToggle.checked,
      lockTimeout: parseInt(lockTimeoutInput.value) || 30,
    },
  })
}

async function clearLocalData() {
  if (confirm('This will clear all local extension data. Continue?')) {
    await chrome.storage.local.clear()
    session = null
    showView('login')
  }
}

function showView(view) {
  loginView.classList.add('hidden')
  mainView.classList.add('hidden')
  addView.classList.add('hidden')
  settingsView.classList.add('hidden')
  
  switch (view) {
    case 'login':
      loginView.classList.remove('hidden')
      break
    case 'main':
      mainView.classList.remove('hidden')
      break
    case 'add':
      addView.classList.remove('hidden')
      break
    case 'settings':
      settingsView.classList.remove('hidden')
      break
  }
}

function showError(element, message) {
  element.textContent = message
  element.classList.add('show')
}

function hideError(element) {
  element.textContent = ''
  element.classList.remove('show')
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function showToast(message) {
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: #f1f5f9;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 1000;
  `
  toast.textContent = message
  document.body.appendChild(toast)
  
  setTimeout(() => toast.remove(), 2000)
}

loginBtn.addEventListener('click', login)
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login()
})

logoutBtn.addEventListener('click', logout)

addPasswordBtn.addEventListener('click', () => showView('add'))
backBtn.addEventListener('click', () => showView('main'))

settingsBtn.addEventListener('click', () => showView('settings'))
backSettingsBtn.addEventListener('click', () => showView('main'))

togglePasswordBtn.addEventListener('click', () => {
  itemPasswordInput.type = itemPasswordInput.type === 'password' ? 'text' : 'password'
})

generateBtn.addEventListener('click', generatePassword)
savePasswordBtn.addEventListener('click', savePassword)

autoFillToggle.addEventListener('change', saveSettings)
autoSaveToggle.addEventListener('change', saveSettings)
lockTimeoutInput.addEventListener('change', saveSettings)
clearDataBtn.addEventListener('click', clearLocalData)

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase()
  const items = passwordsList.querySelectorAll('.password-item')
  
  items.forEach(item => {
    const name = item.querySelector('.name').textContent.toLowerCase()
    const username = item.querySelector('.username').textContent.toLowerCase()
    
    if (name.includes(query) || username.includes(query)) {
      item.style.display = ''
    } else {
      item.style.display = 'none'
    }
  })
})

init()
