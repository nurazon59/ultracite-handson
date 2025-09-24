import { type NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // paramsを非同期で取得
  const { id } = await params;

  // 認証確認
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    // ブックマーク取得
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: "ブックマークが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ bookmark });
  } catch (_error) {
    return NextResponse.json(
      { error: "ブックマークの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // paramsを非同期で取得
  const { id } = await params;

  // 認証確認
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, isPublic, isRead } = body;

  try {
    // ブックマークの所有権確認
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingBookmark) {
      return NextResponse.json(
        { error: "ブックマークが見つかりません" },
        { status: 404 }
      );
    }

    // 更新データの準備（URLは更新対象外）
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) {
      updateData.title = title;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }
    if (isRead !== undefined) {
      updateData.isRead = isRead;
    }

    // ブックマーク更新
    const bookmark = await prisma.bookmark.update({
      where: {
        id,
      },
      data: updateData,
    });

    return NextResponse.json({ bookmark });
  } catch (_error) {
    return NextResponse.json(
      { error: "ブックマークの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // paramsを非同期で取得
  const { id } = await params;

  // 認証確認
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    // ブックマークの所有権確認
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: "ブックマークが見つかりません" },
        { status: 404 }
      );
    }

    // ブックマーク削除
    await prisma.bookmark.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "ブックマークを削除しました" });
  } catch (_error) {
    return NextResponse.json(
      { error: "ブックマークの削除に失敗しました" },
      { status: 500 }
    );
  }
}
