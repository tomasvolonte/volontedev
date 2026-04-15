import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, derivarToken, safeCompare } from '@/lib/adminAuth'

const MAX_AGE = 60 * 60 * 24 * 7 // 7 días

export async function POST(req: NextRequest) {
  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD no configurado' }, { status: 503 })
  }

  const { password } = body
  if (!password) {
    return NextResponse.json({ error: 'password requerido' }, { status: 400 })
  }

  // Comparación de passwords en tiempo constante (antes de derivar token)
  if (!safeCompare(password, adminPassword)) {
    // Pequeño delay para desincentivar fuerza bruta
    await new Promise((r) => setTimeout(r, 300))
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const token = await derivarToken(adminPassword)
  const isProduction = process.env.NODE_ENV === 'production'

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    maxAge: MAX_AGE,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_COOKIE)
  return res
}
