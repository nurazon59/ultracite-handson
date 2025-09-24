import { type NextRequest, NextResponse } from "next/server";
import { createToken, hashPassword, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // バリデーション
    if (!(email && password && name)) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "無効なメールアドレスです" },
        { status: 400 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // JWTトークン生成
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // レスポンス作成
    const response = NextResponse.json({ user }, { status: 201 });

    // Cookieセット
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
