"use client";

import { Bookmark, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("ログアウトに失敗しました");
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      alert("ログアウトに失敗しました");
    } finally {
      setIsLoggingOut(false);
    }
  }

  const NavLinks = () => (
    <>
      <Link
        className="flex items-center gap-2 font-medium text-sm transition-colors hover:text-primary"
        href="/bookmarks"
        onClick={() => setIsOpen(false)}
      >
        マイブックマーク
      </Link>
      <Link
        className="flex items-center gap-2 font-medium text-sm transition-colors hover:text-primary"
        href="/public"
        onClick={() => setIsOpen(false)}
      >
        公開ブックマーク
      </Link>
      <Link
        className="flex items-center gap-2 font-medium text-sm transition-colors hover:text-primary"
        href="/bookmarks/new"
        onClick={() => setIsOpen(false)}
      >
        新規作成
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link className="mr-6 flex items-center gap-2" href="/bookmarks">
          <Bookmark className="h-6 w-6" />
          <span className="font-semibold">ブックマークマネージャー</span>
        </Link>

        <nav className="hidden items-center gap-6 font-medium text-sm md:flex">
          <NavLinks />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            className="hidden md:flex"
            disabled={isLoggingOut}
            onClick={handleLogout}
            size="sm"
            variant="ghost"
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>

          <Sheet onOpenChange={setIsOpen} open={isOpen}>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="ghost">
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニュー</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="mt-6 flex flex-col gap-4">
                <NavLinks />
                <Button
                  className="justify-start"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  size="sm"
                  variant="ghost"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
