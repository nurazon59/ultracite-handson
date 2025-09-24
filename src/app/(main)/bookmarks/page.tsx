import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookmarkCard } from '@/components/bookmarks/bookmark-card'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export default async function BookmarksPage() {
  const user = await getAuthUser()
  
  if (!user) {
    return null
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">マイブックマーク</h1>
        <Button asChild>
          <Link href="/bookmarks/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            ブックマークがまだありません
          </p>
          <Button asChild>
            <Link href="/bookmarks/new">
              最初のブックマークを作成
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
            />
          ))}
        </div>
      )}
    </div>
  )
}