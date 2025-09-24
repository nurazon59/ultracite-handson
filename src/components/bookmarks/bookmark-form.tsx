'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Bookmark } from '@/lib/types'

interface BookmarkFormProps {
  bookmark?: Partial<Bookmark>
  onCancel?: () => void
}

export function BookmarkForm({ bookmark, onCancel }: BookmarkFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!bookmark?.id

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const data = {
      url: formData.get('url') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      isPublic: formData.get('isPublic') === 'on',
    }

    try {
      const response = await fetch(
        isEdit ? `/api/bookmarks/${bookmark.id}` : '/api/bookmarks',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '保存に失敗しました')
      }

      router.push('/bookmarks')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : '保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'ブックマーク編集' : '新規ブックマーク'}</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com"
              defaultValue={bookmark?.url}
              required
              disabled={isLoading || isEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="サイトのタイトル"
              defaultValue={bookmark?.title}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">説明（任意）</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="サイトの説明を入力"
              rows={3}
              defaultValue={bookmark?.description || ''}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              name="isPublic"
              defaultChecked={bookmark?.isPublic}
              disabled={isLoading}
            />
            <Label htmlFor="isPublic" className="cursor-pointer">
              このブックマークを公開する
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '保存中...' : '保存'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}