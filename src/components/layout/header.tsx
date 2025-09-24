'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bookmark, LogOut, Menu, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function Header() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('ログアウトに失敗しました')
      }

      router.push('/login')
      router.refresh()
    } catch (error) {
      alert('ログアウトに失敗しました')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const NavLinks = () => (
    <>
      <Link
        href="/bookmarks"
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
        onClick={() => setIsOpen(false)}
      >
        マイブックマーク
      </Link>
      <Link
        href="/public"
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
        onClick={() => setIsOpen(false)}
      >
        公開ブックマーク
      </Link>
      <Link
        href="/bookmarks/new"
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
        onClick={() => setIsOpen(false)}
      >
        新規作成
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/bookmarks" className="mr-6 flex items-center gap-2">
          <Bookmark className="h-6 w-6" />
          <span className="font-semibold">ブックマークマネージャー</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLinks />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="hidden md:flex"
          >
            <LogOut className="h-4 w-4 mr-2" />
            ログアウト
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニュー</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-6">
                <NavLinks />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}