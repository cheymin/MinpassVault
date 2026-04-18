let autofillPopup = null
let savePrompt = null
let lastSubmittedForm = null

function createAutofillPopup(credentials) {
  if (autofillPopup) {
    autofillPopup.remove()
  }
  
  autofillPopup = document.createElement('div')
  autofillPopup.id = 'minpassvault-autofill-popup'
  autofillPopup.innerHTML = `
    <div class="mpv-popup-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span>MinpassVault</span>
    </div>
    <div class="mpv-popup-content">
      ${credentials.map((cred, index) => `
        <div class="mpv-credential-item" data-index="${index}">
          <div class="mpv-credential-icon">${cred.name.charAt(0).toUpperCase()}</div>
          <div class="mpv-credential-info">
            <div class="mpv-credential-name">${escapeHtml(cred.name)}</div>
            <div class="mpv-credential-username">${escapeHtml(cred.data?.username || '')}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `
  
  document.body.appendChild(autofillPopup)
  
  autofillPopup.querySelectorAll('.mpv-credential-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      fillCredential(credentials[index])
      autofillPopup.remove()
      autofillPopup = null
    })
  })
  
  setTimeout(() => {
    if (autofillPopup) {
      autofillPopup.remove()
      autofillPopup = null
    }
  }, 10000)
}

function fillCredential(credential) {
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
  
  if (usernameField && credential.data?.username) {
    usernameField.value = credential.data.username
    usernameField.dispatchEvent(new Event('input', { bubbles: true }))
    usernameField.dispatchEvent(new Event('change', { bubbles: true }))
  }
  
  if (passwordField && credential.data?.password) {
    passwordField.value = credential.data.password
    passwordField.dispatchEvent(new Event('input', { bubbles: true }))
    passwordField.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

function createSavePrompt(username, password) {
  if (savePrompt) {
    savePrompt.remove()
  }
  
  savePrompt = document.createElement('div')
  savePrompt.id = 'minpassvault-save-prompt'
  savePrompt.innerHTML = `
    <div class="mpv-save-content">
      <div class="mpv-save-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Save password?</span>
      </div>
      <div class="mpv-save-actions">
        <button class="mpv-btn mpv-btn-secondary" id="mpv-never">Never</button>
        <button class="mpv-btn mpv-btn-secondary" id="mpv-not-now">Not now</button>
        <button class="mpv-btn mpv-btn-primary" id="mpv-save">Save</button>
      </div>
    </div>
  `
  
  document.body.appendChild(savePrompt)
  
  document.getElementById('mpv-never').addEventListener('click', () => {
    savePrompt.remove()
    savePrompt = null
  })
  
  document.getElementById('mpv-not-now').addEventListener('click', () => {
    savePrompt.remove()
    savePrompt = null
  })
  
  document.getElementById('mpv-save').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'SAVE_CREDENTIAL',
      data: {
        url: window.location.href,
        username: username,
        password: password,
      },
    }, (response) => {
      if (response?.success) {
        showNotification('Password saved successfully')
      }
    })
    savePrompt.remove()
    savePrompt = null
  })
  
  setTimeout(() => {
    if (savePrompt) {
      savePrompt.remove()
      savePrompt = null
    }
  }, 30000)
}

function showNotification(message) {
  const notification = document.createElement('div')
  notification.id = 'minpassvault-notification'
  notification.textContent = message
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.classList.add('mpv-fade-out')
    setTimeout(() => notification.remove(), 300)
  }, 2000)
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text || ''
  return div.innerHTML
}

function findPasswordFields() {
  return document.querySelectorAll('input[type="password"]')
}

async function checkForCredentials() {
  const settings = await chrome.storage.local.get(['settings'])
  
  if (settings.settings?.autoFill === false) return
  
  const passwordFields = findPasswordFields()
  
  if (passwordFields.length > 0) {
    chrome.runtime.sendMessage({
      type: 'GET_CREDENTIALS',
      url: window.location.href,
    }, (response) => {
      if (response?.success && response.items?.length > 0) {
        const rect = passwordFields[0].getBoundingClientRect()
        
        autofillPopup = document.createElement('div')
        autofillPopup.style.cssText = `
          position: fixed;
          top: ${rect.bottom + window.scrollY + 5}px;
          left: ${rect.left + window.scrollX}px;
          z-index: 2147483647;
        `
        
        createAutofillPopup(response.items)
      }
    })
  }
}

document.addEventListener('submit', (e) => {
  const form = e.target
  const passwordField = form.querySelector('input[type="password"]')
  const usernameField = form.querySelector('input[type="text"], input[type="email"]')
  
  if (passwordField && passwordField.value) {
    lastSubmittedForm = {
      username: usernameField?.value || '',
      password: passwordField.value,
    }
  }
}, true)

chrome.storage.local.get(['settings'], (result) => {
  if (result.settings?.autoSave !== false) {
    setTimeout(() => {
      if (lastSubmittedForm) {
        createSavePrompt(lastSubmittedForm.username, lastSubmittedForm.password)
      }
    }, 1000)
  }
})

if (document.readyState === 'complete') {
  setTimeout(checkForCredentials, 500)
} else {
  window.addEventListener('load', () => {
    setTimeout(checkForCredentials, 500)
  })
}

const observer = new MutationObserver(() => {
  const passwordFields = findPasswordFields()
  if (passwordFields.length > 0) {
    checkForCredentials()
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
})
