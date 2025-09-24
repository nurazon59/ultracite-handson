"use client";

import { Edit, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Bookmark } from "@/lib/types";

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit?: (bookmark: Bookmark) => void;
  isOwner?: boolean;
};

export function BookmarkCard({
  bookmark,
  onEdit,
  isOwner = true,
}: BookmarkCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("このブックマークを削除しますか？")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      router.refresh();
    } catch (_error) {
      alert("削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  }

  async function toggleRead() {
    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: !bookmark.isRead }),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      router.refresh();
    } catch (_error) {
      alert("更新に失敗しました");
    }
  }

  return (
    <Card className="group">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg">
            <a
              className="hover:underline"
              href={bookmark.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {bookmark.title}
            </a>
          </CardTitle>
          <div className="flex items-center gap-2">
            {bookmark.isPublic ? (
              <Badge variant="secondary">公開</Badge>
            ) : (
              <Badge variant="outline">非公開</Badge>
            )}
            {bookmark.isRead && <Badge variant="default">既読</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bookmark.description && (
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {bookmark.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
          <a
            className="flex items-center gap-1 hover:underline"
            href={bookmark.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-3 w-3" />
            {new URL(bookmark.url).hostname}
          </a>
          {bookmark.user && <span>• {bookmark.user.name}</span>}
        </div>
      </CardContent>
      {isOwner && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button
            disabled={isDeleting}
            onClick={toggleRead}
            size="sm"
            variant="ghost"
          >
            {bookmark.isRead ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => onEdit?.(bookmark)}
            size="sm"
            variant="ghost"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            disabled={isDeleting}
            onClick={handleDelete}
            size="sm"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
