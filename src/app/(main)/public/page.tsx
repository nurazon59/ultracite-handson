'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BookmarkCard } from '@/components/bookmarks/bookmark-card'
import { Search } from 'lucide-react'
import type { Bookmark } from '@/lib/types'

export default function PublicBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchBookmarks()
  }, [currentPage, searchQuery])

  async function fetchBookmarks() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchQuery && { q: searchQuery }),
      })

      const response = await fetch(`/api/bookmarks/public?${params}`)
      const data = await response.json()

      if (response.ok) {
        setBookmarks(data.bookmarks)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCurrentPage(1)
    fetchBookmarks()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">公開ブックマーク</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <Input
            type="search"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            検索
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? '検索結果がありません'
              : '公開ブックマークがまだありません'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                isOwner={false}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                前のページ
              </Button>
              <span className="flex items-center px-4">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                次のページ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}