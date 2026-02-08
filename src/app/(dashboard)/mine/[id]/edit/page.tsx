import { redirect } from 'next/navigation'

interface Params {
  id: string
}

export default async function MineEditPage(props: { params: Promise<Params> }) {
  const params = await props.params
  redirect(`/summaries/${params.id}/edit`)
}
