import { type NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 認証確認
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ブックマーク取得
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: params.id,
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
  } catch (error) {
    console.error("Get bookmark error:", error);
    return NextResponse.json(
      { error: "ブックマークの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 認証確認
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, isPublic, isRead } = body;

    // ブックマークの所有権確認
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id: params.id,
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
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isRead !== undefined) updateData.isRead = isRead;

    // ブックマーク更新
    const bookmark = await prisma.bookmark.update({
      where: {
        id: params.id,
      },
      data: updateData,
    });

    return NextResponse.json({ bookmark });
  } catch (error) {
    console.error("Update bookmark error:", error);
    return NextResponse.json(
      { error: "ブックマークの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 認証確認
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ブックマークの所有権確認
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: params.id,
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
        id: params.id,
      },
    });

    return NextResponse.json({ message: "ブックマークを削除しました" });
  } catch (error) {
    console.error("Delete bookmark error:", error);
    return NextResponse.json(
      { error: "ブックマークの削除に失敗しました" },
      { status: 500 }
    );
  }
}
