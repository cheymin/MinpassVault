import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.3.0',
    timestamp: new Date().toISOString(),
    features: [
      'end-to-end-encryption',
      'two-factor-authentication',
      'vault-management',
      'password-generator',
      'import-export',
      'responsive-design',
    ],
  })
}