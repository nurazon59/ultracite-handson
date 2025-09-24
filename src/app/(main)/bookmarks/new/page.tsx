import { BookmarkForm } from '@/components/bookmarks/bookmark-form'

export default function NewBookmarkPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">新規ブックマーク</h1>
      <BookmarkForm />
    </div>
  )
}