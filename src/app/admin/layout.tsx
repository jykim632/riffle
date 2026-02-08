import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { MobileSidebar } from '@/components/admin/mobile-sidebar'
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
      <div className="flex flex-1 flex-col">
        {/* 모바일 헤더 */}
        <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4 lg:hidden">
          <MobileSidebar />
          <span className="text-lg font-semibold">관리자</span>
        </div>
        {/* 메인 콘텐츠: 반응형 패딩 */}
        <main className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
