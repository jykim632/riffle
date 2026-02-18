'use client'

import { ExternalLink, Trash2, Newspaper, BookOpen, Video } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deleteSharedLink } from '@/actions/shared-links'
import { LINK_CATEGORY_LABELS, type LinkCategory } from '@/lib/schemas/shared-link'
import { formatDate } from '@/lib/utils/date'

const CATEGORY_ICONS: Record<LinkCategory, typeof Newspaper> = {
  article: Newspaper,
  book: BookOpen,
  video: Video,
}

interface SharedLink {
  id: string
  url: string
  title: string
  category: LinkCategory
  comment: string | null
  created_at: string
  author_id: string | null
  nickname: string | null
}

interface LinkListProps {
  links: SharedLink[]
  currentUserId: string
}

export function LinkList({ links, currentUserId }: LinkListProps) {
  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="mb-2 text-xl font-semibold">공유된 링크가 없어요</h2>
        <p className="text-muted-foreground">
          첫 번째 링크를 공유해보세요!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {links.map((link) => {
        const Icon = CATEGORY_ICONS[link.category]
        const isOwner = link.author_id === currentUserId

        return (
          <Card key={link.id}>
            <CardContent className="flex items-start gap-3 py-4">
              <div className="mt-0.5 rounded-md bg-muted p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium hover:underline"
                    >
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </a>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {LINK_CATEGORY_LABELS[link.category]}
                      </Badge>
                      <span>{link.nickname ?? '탈퇴한 멤버'}</span>
                      <span>{formatDate(link.created_at)}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <form action={async (formData) => { await deleteSharedLink(formData) }}>
                      <input type="hidden" name="linkId" value={link.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </div>
                {link.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {link.comment}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
