import { redirect } from 'next/navigation'

export default function AdminPage() {
  // /admin 접근 시 /admin/seasons로 리다이렉트
  redirect('/admin/seasons')
}
