import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, derivarToken, safeCompare } from '@/lib/adminAuth'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname.startsWith('/admin/login')) return NextResponse.next()

  const isApiRoute = pathname.startsWith('/api/admin')

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    if (process.env.NODE_ENV === 'production') {
      return isApiRoute
        ? NextResponse.json({ error: 'ADMIN_PASSWORD no configurado' }, { status: 503 })
        : NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.next()
  }

  // Aceptar cookie o header Authorization
  const cookieToken  = req.cookies.get(ADMIN_COOKIE)?.value ?? ''
  const headerToken  = (req.headers.get('authorization') ?? '').replace('Bearer ', '')
  const incomingToken = cookieToken || headerToken

  const expectedToken = await derivarToken(adminPassword)
  const tokenValido   = safeCompare(incomingToken, expectedToken)

  if (!tokenValido) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
