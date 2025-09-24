"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Bookmark } from "@/lib/types";

export default function PublicBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        ...(searchQuery && { q: searchQuery }),
      });

      const response = await fetch(`/api/bookmarks/public?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBookmarks(data.bookmarks);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (_error) {
      // エラーハンドリングは無視（空のブックマークリストを表示）
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    fetchBookmarks();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="font-bold text-3xl">公開ブックマーク</h1>

        <form className="flex max-w-md gap-2" onSubmit={handleSearch}>
          <Input
            className="flex-1"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索..."
            type="search"
            value={searchQuery}
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            検索
          </Button>
        </form>
      </div>

      {(() => {
        if (isLoading) {
          return (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          );
        }
        if (bookmarks.length === 0) {
          return (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "検索結果がありません"
                  : "公開ブックマークがまだありません"}
              </p>
            </div>
          );
        }
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  bookmark={bookmark}
                  isOwner={false}
                  key={bookmark.id}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  variant="outline"
                >
                  前のページ
                </Button>
                <span className="flex items-center px-4">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  variant="outline"
                >
                  次のページ
                </Button>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
