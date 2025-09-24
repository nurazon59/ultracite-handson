import bcrypt from "bcrypt";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

export type JWTPayload = {
  id: string;
  email: string;
  name: string;
};

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  if (!(payload.id && payload.email && payload.name)) {
    throw new Error("Invalid token payload");
  }
  return {
    id: payload.id as string,
    email: payload.email as string,
    name: payload.name as string,
  };
}

export async function getAuthUser(
  request?: NextRequest
): Promise<JWTPayload | null> {
  let token: string | undefined;

  // テスト環境の場合
  if (process.env.NODE_ENV === "test" && request) {
    // テスト環境では、特別なヘッダーからトークンを取得
    token = request.headers.get("x-test-token") || undefined;
  } else if (request) {
    // 通常のリクエストからCookieを取得
    const cookieHeader =
      request.headers.get("cookie") || request.headers.get("Cookie");
    token = cookieHeader
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];
  }

  // requestがない場合、本番環境ではcookies()を使用
  if (!(token || request)) {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("token");
    token = cookieToken?.value;
  }

  if (!token) {
    return null;
  }

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24時間
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}
