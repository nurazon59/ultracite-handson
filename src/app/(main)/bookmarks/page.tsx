import { Plus } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BookmarksPage() {
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">マイブックマーク</h1>
        <Button asChild>
          <Link href="/bookmarks/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      {bookmarks.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">
            ブックマークがまだありません
          </p>
          <Button asChild>
            <Link href="/bookmarks/new">最初のブックマークを作成</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard bookmark={bookmark} key={bookmark.id} />
          ))}
        </div>
      )}
    </div>
  );
}
