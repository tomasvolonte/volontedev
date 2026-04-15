/**
 * Helpers de autenticación del panel admin.
 * Usa Web Crypto API (disponible en Edge Runtime y Node.js).
 * No importa nada de Node.js para ser compatible con proxy.ts (Edge).
 */

export const ADMIN_COOKIE = 'admin_token'

/**
 * Deriva un token HMAC-SHA256 a partir del password configurado.
 * Almacenar el token en la cookie (no el password en texto plano).
 */
export async function derivarToken(password: string): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD ?? ''
  const enc = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Comparación de strings en tiempo constante (evita timing attacks).
 * Funciona en Edge Runtime (sin timingSafeEqual de Node.js).
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
