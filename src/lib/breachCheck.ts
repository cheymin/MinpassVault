import CryptoJS from 'crypto-js'

export interface BreachCheckResult {
  compromised: boolean
  count?: number
  error?: string
}

export async function checkPasswordBreach(password: string): Promise<BreachCheckResult> {
  try {
    const sha1Hash = CryptoJS.SHA1(password).toString().toUpperCase()
    const prefix = sha1Hash.substring(0, 5)
    const suffix = sha1Hash.substring(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'MinpassVault-PasswordChecker',
      },
    })

    if (!response.ok) {
      return {
        compromised: false,
        error: 'API request failed',
      }
    }

    const data = await response.text()
    const lines = data.split('\n')
    
    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(':')
      if (hashSuffix === suffix) {
        return {
          compromised: true,
          count: parseInt(count, 10),
        }
      }
    }

    return {
      compromised: false,
      count: 0,
    }
  } catch (error) {
    return {
      compromised: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function checkMultiplePasswords(
  passwords: Array<{ id: string; name: string; password: string }>
): Promise<Array<{ id: string; name: string; result: BreachCheckResult }>> {
  const results = []
  
  for (const item of passwords) {
    const result = await checkPasswordBreach(item.password)
    results.push({
      id: item.id,
      name: item.name,
      result,
    })
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  return results
}
