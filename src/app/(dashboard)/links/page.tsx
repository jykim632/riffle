import { requireUser } from '@/lib/auth'
import { getCurrentSeason } from '@/lib/queries/season'
import { normalizeRelation } from '@/lib/utils/supabase'
import { EmptyState } from '@/components/empty-state'
import { LinkForm } from '@/components/links/link-form'
import { LinkList } from '@/components/links/link-list'
import type { LinkCategory } from '@/lib/schemas/shared-link'

export default async function LinksPage() {
  const { supabase, user } = await requireUser()

  const currentSeason = await getCurrentSeason(supabase)

  if (!currentSeason) {
    return <EmptyState title="현재 시즌이 없어요" description="관리자에게 시즌 생성을 요청하세요." />
  }

  const { data: linksRaw } = await supabase
    .from('shared_links')
    .select('id, url, title, category, comment, created_at, author_id, profiles(nickname)')
    .eq('season_id', currentSeason.id)
    .order('created_at', { ascending: false })

  type LinkWithProfile = {
    id: string
    url: string
    title: string
    category: LinkCategory
    comment: string | null
    created_at: string
    author_id: string | null
    profiles: { nickname: string } | { nickname: string }[] | null
  }

  const links = (linksRaw as unknown as LinkWithProfile[] | null)?.map((link) => ({
    id: link.id,
    url: link.url,
    title: link.title,
    category: link.category,
    comment: link.comment,
    created_at: link.created_at,
    author_id: link.author_id,
    nickname: normalizeRelation(link.profiles)?.nickname ?? null,
  })) ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">추천글</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          경제 관련 기사, 책, 영상을 추천해보세요
        </p>
      </div>
      <div className="space-y-6">
        <LinkForm />
        <LinkList links={links} currentUserId={user.id} />
      </div>
    </div>
  )
}
