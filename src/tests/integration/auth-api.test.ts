import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/db";

// リクエストボディの型定義
interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// テスト用のNextRequestを作成するヘルパー関数
function createTestRequest(
  body: RegisterBody | LoginBody | Record<string, never>
): NextRequest {
  const url = "http://localhost:3000/api/test";
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("認証API", () => {
  beforeEach(async () => {
    // テスト前にデータベースをクリーンアップ
    await prisma.user.deleteMany();
  });

  describe("POST /api/auth/register", () => {
    it("新規ユーザーを登録できる", async () => {
      const requestBody: RegisterBody = {
        email: "test@example.com",
        password: "password123",
        name: "テストユーザー",
      };

      const request = createTestRequest(requestBody);
      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toMatchObject({
        email: requestBody.email,
        name: requestBody.name,
      });
      expect(data.user.passwordHash).toBeUndefined();

      // Cookieにトークンが設定されていることを確認
      const setCookieHeader = response.headers.get("Set-Cookie");
      expect(setCookieHeader).toMatch(/token=/);
      expect(setCookieHeader).toMatch(/HttpOnly/);
      expect(setCookieHeader).toMatch(/SameSite=Strict/);
    });

    it("同じメールアドレスで重複登録はできない", async () => {
      const requestBody: RegisterBody = {
        email: "test@example.com",
        password: "password123",
        name: "テストユーザー",
      };

      // 1回目の登録
      const request1 = createTestRequest(requestBody);
      await registerHandler(request1);

      // 2回目の登録（重複）
      const request2 = createTestRequest(requestBody);
      const response = await registerHandler(request2);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/既に登録されています/);
    });

    it("必須項目が不足している場合はエラーを返す", async () => {
      const invalidRequests = [
        { password: "password123", name: "テスト" } as Partial<RegisterBody>,
        { email: "test@example.com", name: "テスト" } as Partial<RegisterBody>,
        {
          email: "test@example.com",
          password: "password123",
        } as Partial<RegisterBody>,
      ];

      for (const body of invalidRequests) {
        const request = createTestRequest(body as RegisterBody);
        const response = await registerHandler(request);
        expect(response.status).toBe(400);
      }
    });

    it("無効なメールアドレスはエラーを返す", async () => {
      const requestBody: RegisterBody = {
        email: "invalid-email",
        password: "password123",
        name: "テストユーザー",
      };

      const request = createTestRequest(requestBody);
      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/無効なメールアドレス/);
    });
  });

  describe("POST /api/auth/login", () => {
    const testUser: RegisterBody = {
      email: "test@example.com",
      password: "password123",
      name: "テストユーザー",
    };

    beforeEach(async () => {
      // テスト用ユーザーを事前に登録
      const request = createTestRequest(testUser);
      await registerHandler(request);
    });

    it("正しい資格情報でログインできる", async () => {
      const request = createTestRequest({
        email: testUser.email,
        password: testUser.password,
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toMatchObject({
        email: testUser.email,
        name: testUser.name,
      });

      // Cookieにトークンが設定されていることを確認
      const setCookieHeader = response.headers.get("Set-Cookie");
      expect(setCookieHeader).toMatch(/token=/);
    });

    it("間違ったパスワードではログインできない", async () => {
      const request = createTestRequest({
        email: testUser.email,
        password: "wrongpassword",
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(
        /メールアドレスまたはパスワードが正しくありません/
      );
    });

    it("存在しないユーザーではログインできない", async () => {
      const request = createTestRequest({
        email: "notexist@example.com",
        password: "password123",
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(
        /メールアドレスまたはパスワードが正しくありません/
      );
    });
  });

  describe("POST /api/auth/logout", () => {
    it("ログアウトするとCookieが削除される", async () => {
      const request = createTestRequest({});

      const response = await logoutHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("ログアウトしました");

      // Cookieが削除されることを確認
      const setCookieHeader = response.headers.get("Set-Cookie");
      expect(setCookieHeader).toMatch(/token=;/);
      expect(setCookieHeader).toMatch(/Max-Age=0/);
    });
  });
});
