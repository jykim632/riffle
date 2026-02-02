import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SummaryForm } from '@/components/summary/summary-form'

interface Params {
  id: string
}

export default async function EditSummaryPage(props: { params: Promise<Params> }) {
  const params = await props.params
  const supabase = await createClient()

  // 1. 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. 요약본 조회 (JOIN: weeks)
  const { data: summary, error } = await supabase
    .from('summaries')
    .select('*, weeks(title)')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !summary) {
    notFound()
  }

  // 3. 본인 확인 (RLS가 막지만 UI에서도 체크)
  if (summary.author_id !== user.id) {
    redirect(`/summaries/${params.id}`)
  }

  // Supabase JOIN 결과 타입 처리
  const weeks = Array.isArray(summary.weeks) ? summary.weeks[0] : summary.weeks

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">요약본 수정하기</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          작성한 요약본을 수정하세요
        </p>
      </div>

      <SummaryForm
        mode="edit"
        summaryId={params.id}
        initialContent={summary.content}
        weekTitle={weeks?.title}
      />
    </div>
  )
}
