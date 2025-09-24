import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/db";

// HTTPステータスコード定数
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 正規表現定数
const TOKEN_REGEX = /token=/;
const HTTP_ONLY_REGEX = /HttpOnly/;
const SAME_SITE_REGEX = /SameSite=Strict/;
const ALREADY_REGISTERED_REGEX = /既に登録されています/;
const INVALID_EMAIL_REGEX = /無効なメールアドレス/;
const INVALID_CREDENTIALS_REGEX =
  /メールアドレスまたはパスワードが正しくありません/;
const TOKEN_EMPTY_REGEX = /token=;/;
const MAX_AGE_ZERO_REGEX = /Max-Age=0/;

// リクエストボディの型定義
type RegisterBody = {
  email: string;
  password: string;
  name: string;
};

type LoginBody = {
  email: string;
  password: string;
};

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

      // デバッグ情報を追加
      if (response.status !== HTTP_STATUS.CREATED) {
        console.error("Register error:", data);
      }

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.user).toMatchObject({
        email: requestBody.email,
        name: requestBody.name,
      });
      expect(data.user.passwordHash).toBeUndefined();

      // Cookieにトークンが設定されていることを確認
      const setCookieHeader = response.headers.get("Set-Cookie");
      expect(setCookieHeader).toMatch(TOKEN_REGEX);
      expect(setCookieHeader).toMatch(HTTP_ONLY_REGEX);
      expect(setCookieHeader).toMatch(SAME_SITE_REGEX);
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

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error).toMatch(ALREADY_REGISTERED_REGEX);
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
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
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

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error).toMatch(INVALID_EMAIL_REGEX);
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

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user).toMatchObject({
        email: testUser.email,
        name: testUser.name,
      });

      // Cookieにトークンが設定されていることを確認
      const setCookieHeader = response.headers.get("Set-Cookie");
      expect(setCookieHeader).toMatch(TOKEN_REGEX);
    });

    it("間違ったパスワードではログインできない", async () => {
      const request = createTestRequest({
        email: testUser.email,
        password: "wrongpassword",
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error).toMatch(INVALID_CREDENTIALS_REGEX);
    });

    it("存在しないユーザーではログインできない", async () => {
      const request = createTestRequest({
        email: "notexist@example.com",
        password: "password123",
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error).toMatch(INVALID_CREDENTIALS_REGEX);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("ログアウトするとCookieが削除される", async () => {
      const request = createTestRequest({});

      const response = await logoutHandler(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.message).toBe("ログアウトしました");

      // Cookieが削除されることを確認
      const setCookieHeader = response.headers.get("Set-Cookie");
      expect(setCookieHeader).toMatch(TOKEN_EMPTY_REGEX);
      expect(setCookieHeader).toMatch(MAX_AGE_ZERO_REGEX);
    });
  });
});
