import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { compromised: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    const sha1Hash = CryptoJS.SHA1(password).toString().toUpperCase()
    const prefix = sha1Hash.substring(0, 5)
    const suffix = sha1Hash.substring(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'MinpassVault-PasswordChecker',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { compromised: false, error: 'API request failed' },
        { status: 500 }
      )
    }

    const data = await response.text()
    const lines = data.split('\n')
    
    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(':')
      if (hashSuffix === suffix) {
        return NextResponse.json({
          compromised: true,
          count: parseInt(count, 10),
        })
      }
    }

    return NextResponse.json({
      compromised: false,
      count: 0,
    })
  } catch (error) {
    return NextResponse.json(
      { compromised: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
