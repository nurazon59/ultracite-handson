import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/bookmarks/public/route";
import { createToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

// HTTPステータスコード定数
const HTTP_STATUS = {
  OK: 200,
} as const;

// マジックナンバー定数
const PUBLIC_BOOKMARKS_COUNT = 3;

type TestUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
};

// テスト用のNextRequestを作成するヘルパー関数
function createTestRequest(searchParams?: string, token?: string): NextRequest {
  const url = `http://localhost:3000/api/bookmarks/public${searchParams ? `?${searchParams}` : ""}`;
  const headers = new Headers();

  if (token) {
    headers.append("Cookie", `token=${token}`);
  }

  return new NextRequest(url, {
    method: "GET",
    headers,
  });
}

describe("公開ブックマークAPI", () => {
  let user1: TestUser;
  let user2: TestUser;
  let _authToken1: string;
  let _authToken2: string;

  beforeEach(async () => {
    // テスト前にデータベースをクリーンアップ
    await prisma.bookmark.deleteMany();
    await prisma.user.deleteMany();

    // テスト用ユーザーを作成
    user1 = await prisma.user.create({
      data: {
        email: "user1@example.com",
        passwordHash: "hashedpassword",
        name: "ユーザー1",
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: "user2@example.com",
        passwordHash: "hashedpassword",
        name: "ユーザー2",
      },
    });

    // 認証トークンを生成
    _authToken1 = await createToken({
      id: user1.id,
      email: user1.email,
      name: user1.name,
    });

    _authToken2 = await createToken({
      id: user2.id,
      email: user2.email,
      name: user2.name,
    });
  });

  describe("GET /api/bookmarks/public", () => {
    beforeEach(async () => {
      // テスト用のブックマークを作成
      await prisma.bookmark.createMany({
        data: [
          // ユーザー1のブックマーク
          {
            url: "https://public1.com",
            title: "公開ブックマーク1",
            description: "プログラミングに関する記事",
            userId: user1.id,
            isPublic: true,
          },
          {
            url: "https://private1.com",
            title: "非公開ブックマーク1",
            userId: user1.id,
            isPublic: false,
          },
          {
            url: "https://public2.com",
            title: "公開ブックマーク2",
            description: "JavaScript入門",
            userId: user1.id,
            isPublic: true,
          },
          // ユーザー2のブックマーク
          {
            url: "https://public3.com",
            title: "公開ブックマーク3",
            description: "React開発ガイド",
            userId: user2.id,
            isPublic: true,
          },
          {
            url: "https://private2.com",
            title: "非公開ブックマーク2",
            userId: user2.id,
            isPublic: false,
          },
        ],
      });
    });

    it("公開ブックマークのみを取得できる", async () => {
      const request = createTestRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.bookmarks).toHaveLength(PUBLIC_BOOKMARKS_COUNT);
      expect(
        data.bookmarks.every((b: { isPublic: boolean }) => b.isPublic)
      ).toBe(true);
    });

    it("ユーザー情報も含めて取得できる", async () => {
      const request = createTestRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.bookmarks[0]).toHaveProperty("user");
      expect(data.bookmarks[0].user).toHaveProperty("name");
      expect(data.bookmarks[0].user).toHaveProperty("email");
      expect(data.bookmarks[0].user).not.toHaveProperty("passwordHash");
    });

    it("キーワードで検索できる", async () => {
      const request = createTestRequest("q=JavaScript");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.bookmarks).toHaveLength(1);
      expect(data.bookmarks[0].description).toContain("JavaScript");
    });

    it("タイトルと説明の両方で検索できる", async () => {
      const request = createTestRequest("q=プログラミング");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.bookmarks).toHaveLength(1);
      expect(data.bookmarks[0].description).toContain("プログラミング");
    });

    it("ユーザーIDでフィルタリングできる", async () => {
      const request = createTestRequest(`userId=${user1.id}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.bookmarks).toHaveLength(2);
      expect(
        data.bookmarks.every((b: { userId: string }) => b.userId === user1.id)
      ).toBe(true);
    });

    it("検索とユーザーフィルタを組み合わせられる", async () => {
      const request = createTestRequest(`q=公開&userId=${user2.id}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.bookmarks).toHaveLength(1);
      expect(data.bookmarks[0].userId).toBe(user2.id);
      expect(data.bookmarks[0].title).toContain("公開");
    });

    it("ページネーションができる", async () => {
      // より多くのブックマークを作成
      const moreBookmarks = Array.from({ length: 20 }, (_, i) => ({
        url: `https://example${i}.com`,
        title: `追加公開ブックマーク${i}`,
        userId: user1.id,
        isPublic: true,
      }));

      await prisma.bookmark.createMany({ data: moreBookmarks });

      // 1ページ目
      const request1 = createTestRequest("page=1&limit=10");
      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(HTTP_STATUS.OK);
      expect(data1.bookmarks).toHaveLength(10);
      expect(data1.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 23, // 既存3 + 新規20
        totalPages: 3,
      });

      // 2ページ目
      const request2 = createTestRequest("page=2&limit=10");
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(HTTP_STATUS.OK);
      expect(data2.bookmarks).toHaveLength(10);
      expect(data2.pagination.page).toBe(2);
    });

    it("認証なしでも公開ブックマークを取得できる", async () => {
      const request = createTestRequest(); // トークンなし
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.bookmarks).toHaveLength(PUBLIC_BOOKMARKS_COUNT);
    });

    it("検索結果が0件の場合も正常に処理される", async () => {
      const request = createTestRequest("q=存在しないキーワード");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.bookmarks).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });
  });
});
