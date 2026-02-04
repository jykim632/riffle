import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { isAdmin } from '@/lib/utils/season-membership'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 관리자 권한 확인
  const admin = await isAdmin(user.id)
  if (!admin) {
    // 관리자가 아니면 404
    notFound()
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-muted/30 p-8">
        {children}
      </main>
    </div>
  )
}
