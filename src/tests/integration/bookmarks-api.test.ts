import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/bookmarks/route'
import { GET as getBookmark, PUT, DELETE } from '@/app/api/bookmarks/[id]/route'
import { prisma } from '@/lib/db'
import { createToken } from '@/lib/auth'

interface TestUser {
  id: string
  email: string
  name: string
  passwordHash: string
}

interface BookmarkBody {
  url: string
  title: string
  description?: string
  isPublic?: boolean
}

// テスト用のNextRequestを作成するヘルパー関数
function createTestRequest(
  method: string,
  body?: BookmarkBody | Partial<BookmarkBody>,
  token?: string
): NextRequest {
  const url = 'http://localhost:3000/api/test'
  const headers = new Headers({
    'Content-Type': 'application/json',
  })
  
  if (token) {
    headers.append('Cookie', `token=${token}`)
  }
  
  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('ブックマークAPI', () => {
  let testUser: TestUser
  let authToken: string

  beforeEach(async () => {
    // テスト前にデータベースをクリーンアップ
    await prisma.bookmark.deleteMany()
    await prisma.user.deleteMany()
    
    // テスト用ユーザーを作成
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        name: 'テストユーザー'
      }
    })
    
    // 認証トークンを生成
    authToken = await createToken({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name
    })
  })

  describe('POST /api/bookmarks', () => {
    it('認証されたユーザーはブックマークを作成できる', async () => {
      const bookmarkData: BookmarkBody = {
        url: 'https://example.com',
        title: 'Example Site',
        description: 'This is an example',
        isPublic: true
      }

      const request = createTestRequest('POST', bookmarkData, authToken)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.bookmark).toMatchObject({
        url: bookmarkData.url,
        title: bookmarkData.title,
        description: bookmarkData.description,
        isPublic: bookmarkData.isPublic,
        isRead: false,
        userId: testUser.id
      })
    })

    it('認証されていないユーザーはブックマークを作成できない', async () => {
      const bookmarkData: BookmarkBody = {
        url: 'https://example.com',
        title: 'Example Site'
      }

      const request = createTestRequest('POST', bookmarkData)
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('必須項目が不足している場合はエラーを返す', async () => {
      const invalidRequests = [
        { title: 'No URL' }, // URLなし
        { url: 'https://example.com' }, // タイトルなし
      ]

      for (const body of invalidRequests) {
        const request = createTestRequest('POST', body, authToken)
        const response = await POST(request)
        expect(response.status).toBe(400)
      }
    })

    it('無効なURLはエラーを返す', async () => {
      const bookmarkData = {
        url: 'not-a-url',
        title: 'Invalid URL'
      }

      const request = createTestRequest('POST', bookmarkData, authToken)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/無効なURL/)
    })
  })

  describe('GET /api/bookmarks', () => {
    beforeEach(async () => {
      // テスト用のブックマークを作成
      await prisma.bookmark.createMany({
        data: [
          {
            url: 'https://example1.com',
            title: 'Example 1',
            userId: testUser.id,
            isPublic: false,
            isRead: false
          },
          {
            url: 'https://example2.com',
            title: 'Example 2',
            userId: testUser.id,
            isPublic: true,
            isRead: true
          },
          {
            url: 'https://example3.com',
            title: 'Example 3',
            userId: testUser.id,
            isPublic: true,
            isRead: false
          }
        ]
      })
    })

    it('認証されたユーザーは自分のブックマーク一覧を取得できる', async () => {
      const request = createTestRequest('GET', undefined, authToken)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookmarks).toHaveLength(3)
      expect(data.bookmarks[0]).toHaveProperty('url')
      expect(data.bookmarks[0]).toHaveProperty('title')
      expect(data.bookmarks[0]).toHaveProperty('isPublic')
      expect(data.bookmarks[0]).toHaveProperty('isRead')
    })

    it('認証されていないユーザーはブックマーク一覧を取得できない', async () => {
      const request = createTestRequest('GET')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/bookmarks/[id]', () => {
    let bookmark: { id: string }

    beforeEach(async () => {
      bookmark = await prisma.bookmark.create({
        data: {
          url: 'https://example.com',
          title: 'Example',
          userId: testUser.id,
          isPublic: false
        }
      })
    })

    it('認証されたユーザーは自分のブックマークを取得できる', async () => {
      const request = createTestRequest('GET', undefined, authToken)
      const response = await getBookmark(request, { params: { id: bookmark.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookmark).toMatchObject({
        id: bookmark.id,
        url: 'https://example.com',
        title: 'Example'
      })
    })

    it('他人のブックマークは取得できない', async () => {
      // 別のユーザーを作成
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword',
          name: '他のユーザー'
        }
      })

      const otherBookmark = await prisma.bookmark.create({
        data: {
          url: 'https://other.com',
          title: 'Other',
          userId: otherUser.id,
          isPublic: false
        }
      })

      const request = createTestRequest('GET', undefined, authToken)
      const response = await getBookmark(request, { params: { id: otherBookmark.id } })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/bookmarks/[id]', () => {
    let bookmark: { id: string }

    beforeEach(async () => {
      bookmark = await prisma.bookmark.create({
        data: {
          url: 'https://example.com',
          title: 'Example',
          description: 'Original description',
          userId: testUser.id,
          isPublic: false,
          isRead: false
        }
      })
    })

    it('認証されたユーザーは自分のブックマークを更新できる', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        isPublic: true,
        isRead: true
      }

      const request = createTestRequest('PUT', updateData, authToken)
      const response = await PUT(request, { params: { id: bookmark.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookmark).toMatchObject({
        id: bookmark.id,
        url: 'https://example.com', // URLは変更されない
        title: updateData.title,
        description: updateData.description,
        isPublic: updateData.isPublic,
        isRead: updateData.isRead
      })
    })

    it('URLは更新できない', async () => {
      const updateData = {
        url: 'https://newurl.com',
        title: 'Updated Title'
      }

      const request = createTestRequest('PUT', updateData, authToken)
      const response = await PUT(request, { params: { id: bookmark.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookmark.url).toBe('https://example.com') // 元のURLのまま
    })
  })

  describe('DELETE /api/bookmarks/[id]', () => {
    let bookmark: { id: string }

    beforeEach(async () => {
      bookmark = await prisma.bookmark.create({
        data: {
          url: 'https://example.com',
          title: 'Example',
          userId: testUser.id
        }
      })
    })

    it('認証されたユーザーは自分のブックマークを削除できる', async () => {
      const request = createTestRequest('DELETE', undefined, authToken)
      const response = await DELETE(request, { params: { id: bookmark.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('ブックマークを削除しました')

      // データベースから削除されていることを確認
      const deletedBookmark = await prisma.bookmark.findUnique({
        where: { id: bookmark.id }
      })
      expect(deletedBookmark).toBeNull()
    })

    it('他人のブックマークは削除できない', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword',
          name: '他のユーザー'
        }
      })

      const otherBookmark = await prisma.bookmark.create({
        data: {
          url: 'https://other.com',
          title: 'Other',
          userId: otherUser.id
        }
      })

      const request = createTestRequest('DELETE', undefined, authToken)
      const response = await DELETE(request, { params: { id: otherBookmark.id } })

      expect(response.status).toBe(404)

      // データベースにまだ存在することを確認
      const existingBookmark = await prisma.bookmark.findUnique({
        where: { id: otherBookmark.id }
      })
      expect(existingBookmark).not.toBeNull()
    })
  })
})