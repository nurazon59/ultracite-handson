import bcrypt from 'bcrypt'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

export interface JWTPayload {
  id: string
  email: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as JWTPayload
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('token')
  
  if (!token) {
    return null
  }
  
  try {
    return await verifyToken(token.value)
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = cookies()
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24時間
    path: '/'
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })
}