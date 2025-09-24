import { type NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  // 認証確認
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    // 自分のブックマーク一覧を取得
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ bookmarks });
  } catch (_error) {
    return NextResponse.json(
      { error: "ブックマークの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 認証確認
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await request.json();
  const { url, title, description, isPublic = false } = body;

  // バリデーション
  if (!(url && title)) {
    return NextResponse.json(
      { error: "必須項目が不足しています" },
      { status: 400 }
    );
  }

  // URL形式チェック
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "無効なURLです" }, { status: 400 });
  }

  try {
    // ブックマーク作成
    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        title,
        description,
        isPublic,
        userId: user.id,
      },
    });

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "ブックマークの作成に失敗しました" },
      { status: 500 }
    );
  }
}
