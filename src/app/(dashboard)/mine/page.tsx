import { redirect } from 'next/navigation'

export default function MinePage() {
  redirect('/summaries?filter=mine')
}
