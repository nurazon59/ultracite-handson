import { describe, expect, it } from "vitest";
import {
  createToken,
  hashPassword,
  verifyPassword,
  verifyToken,
} from "@/lib/auth";

describe("認証ユーティリティ", () => {
  describe("パスワードハッシュ化", () => {
    it("パスワードをハッシュ化できる", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]?\$\d+\$/);
    });

    it("同じパスワードでも異なるハッシュが生成される", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("パスワード検証", () => {
    it("正しいパスワードを検証できる", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("間違ったパスワードは検証に失敗する", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe("JWT生成", () => {
    it("ユーザー情報からトークンを生成できる", async () => {
      const user = {
        id: "user123",
        email: "test@example.com",
        name: "テストユーザー",
      };

      const token = await createToken(user);
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });
  });

  describe("JWT検証", () => {
    it("有効なトークンを検証できる", async () => {
      const user = {
        id: "user123",
        email: "test@example.com",
        name: "テストユーザー",
      };

      const token = await createToken(user);
      const payload = await verifyToken(token);

      expect(payload).toBeTruthy();
      expect(payload.id).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.name).toBe(user.name);
    });

    it("無効なトークンは検証に失敗する", async () => {
      const invalidToken = "invalid.token.here";

      await expect(verifyToken(invalidToken)).rejects.toThrow();
    });

    it("改ざんされたトークンは検証に失敗する", async () => {
      const user = {
        id: "user123",
        email: "test@example.com",
        name: "テストユーザー",
      };

      const token = await createToken(user);
      const tamperedToken = token.slice(0, -10) + "tampered";

      await expect(verifyToken(tamperedToken)).rejects.toThrow();
    });
  });
});
