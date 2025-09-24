import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");
    const userId = searchParams.get("userId");
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);

    // 検索条件の構築
    const where: Record<string, unknown> = {
      isPublic: true,
    };

    // キーワード検索
    if (q) {
      where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
    }

    // ユーザーフィルタ
    if (userId) {
      where.userId = userId;
    }

    // 総件数取得
    const total = await prisma.bookmark.count({ where });

    // ブックマーク取得
    const bookmarks = await prisma.bookmark.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // ページネーション情報
    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json({
      bookmarks,
      pagination,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "公開ブックマークの取得に失敗しました" },
      { status: 500 }
    );
  }
}
