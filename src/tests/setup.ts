import "@testing-library/jest-dom";
import { execSync } from "node:child_process";
import { afterAll, beforeAll } from "vitest";

// テスト環境用の環境変数を設定
// NODE_ENVはvitestが自動的に設定するので、直接設定しない
process.env.DATABASE_URL = "file:./prisma/test.db";

// テスト実行前にテストデータベースをセットアップ
beforeAll(() => {
  // 既存のテストデータベースを削除
  try {
    execSync("rm -f prisma/test.db prisma/test.db-journal");
  } catch (_e) {
    // ファイルが存在しない場合は無視
  }

  // マイグレーションをデプロイ（開発モード無しで）
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
  });

  // Prismaクライアントを生成
  execSync("npx prisma generate", {
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
  });
});

// テスト終了後にテストデータベースを削除
afterAll(() => {
  try {
    execSync("rm -f prisma/test.db prisma/test.db-journal");
  } catch (_e) {
    // エラーは無視
  }
});
