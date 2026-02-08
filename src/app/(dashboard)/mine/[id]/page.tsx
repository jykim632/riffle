import { redirect } from 'next/navigation'

interface Params {
  id: string
}

export default async function MineSummaryDetailPage(props: { params: Promise<Params> }) {
  const params = await props.params
  redirect(`/summaries/${params.id}`)
}
