import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { isAdmin } from '@/lib/utils/season-membership'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireUser()

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
