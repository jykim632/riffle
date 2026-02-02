import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { UserMenu } from './user-menu'

interface HeaderProps {
  currentWeek: {
    week_number: number
    title: string | null
  }
  user: {
    nickname: string
  }
}

export function Header({ currentWeek, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-6">
        {/* 로고 */}
        <Link href="/dashboard" className="mr-8 flex items-center gap-2">
          <span className="text-xl font-bold">Riffle</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-primary"
          >
            대시보드
          </Link>
          <Link
            href="/summaries"
            className="transition-colors hover:text-primary"
          >
            요약본
          </Link>
        </nav>

        {/* 우측 영역 */}
        <div className="ml-auto flex items-center gap-4">
          {/* 현재 주차 배지 */}
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {currentWeek.week_number}주차
          </Badge>

          {/* 사용자 메뉴 */}
          <UserMenu nickname={user.nickname} />
        </div>
      </div>
    </header>
  )
}
