import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 自分のブックマーク一覧を取得
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return NextResponse.json(
      { error: 'ブックマークの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { url, title, description, isPublic = false } = body

    // バリデーション
    if (!url || !title) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // URL形式チェック
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: '無効なURLです' },
        { status: 400 }
      )
    }

    // ブックマーク作成
    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        title,
        description,
        isPublic,
        userId: user.id
      }
    })

    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (error) {
    console.error('Create bookmark error:', error)
    return NextResponse.json(
      { error: 'ブックマークの作成に失敗しました' },
      { status: 500 }
    )
  }
}