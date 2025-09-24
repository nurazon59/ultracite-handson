import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");
  const isProtectedPage = request.nextUrl.pathname.startsWith("/bookmarks");

  if (token) {
    try {
      await jwtVerify(token.value, JWT_SECRET);

      // 認証済みユーザーはログイン・登録ページにアクセスできない
      if (isAuthPage) {
        return NextResponse.redirect(new URL("/bookmarks", request.url));
      }
    } catch {
      // トークンが無効な場合
      if (isProtectedPage) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  } else {
    // 未認証ユーザーは保護されたページにアクセスできない
    if (isProtectedPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/bookmarks/:path*"],
};
