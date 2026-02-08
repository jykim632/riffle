'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, List, Users, Key, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/admin/seasons',
    icon: Calendar,
    label: '시즌 관리',
  },
  {
    href: '/admin/weeks',
    icon: List,
    label: '주차 관리',
  },
  {
    href: '/admin/members',
    icon: Users,
    label: '멤버 관리',
  },
  {
    href: '/admin/invite-codes',
    icon: Key,
    label: '초대 코드',
  },
  {
    href: '/admin/indicators',
    icon: BarChart3,
    label: '경제지표',
  },
]

export function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      <div className="border-b p-6">
        <h2 className="text-lg font-semibold">관리자 페이지</h2>
        <p className="text-sm text-muted-foreground">시스템 관리</p>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 border-r bg-muted/30 lg:block">
      <div className="sticky top-0">
        <AdminSidebarContent />
      </div>
    </aside>
  )
}
