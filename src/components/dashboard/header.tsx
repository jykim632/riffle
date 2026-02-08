import Link from 'next/link'
import { Calendar, BookOpen, Radio } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { UserMenu } from './user-menu'

interface HeaderProps {
  currentWeek: {
    week_number: number
    title: string | null
  }
  user: {
    nickname: string
  }
  isAdmin?: boolean
}

export function Header({ currentWeek, user, isAdmin = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link href="/dashboard" className="mr-4 flex items-center gap-2 sm:mr-8">
          <span className="text-lg font-bold sm:text-xl">Riffle</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
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
            게시판
          </Link>
          {isAdmin && (
            <Link
              href="/admin/seasons"
              className="transition-colors hover:text-primary"
            >
              관리자
            </Link>
          )}
        </nav>

        {/* 우측 영역 */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {/* 현재 주차 배지 */}
          <Badge variant="outline" className="gap-1 text-xs sm:text-sm">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">{currentWeek.week_number}주차</span>
            <span className="sm:hidden">{currentWeek.week_number}주</span>
          </Badge>

          {/* 공부방 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" asChild>
                  <a
                    href="https://www.imbc.com/broad/radio/fm/economy/v2/setting/corner/daily/3709975_76330.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Radio className="h-4 w-4" />
                    <span className="hidden sm:inline">손경제 홈페이지</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>공부방</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 가이드 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href="/guide">
                    <BookOpen className="h-4 w-4" />
                    <span className="sr-only">가이드</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>가이드</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 사용자 메뉴 */}
          <UserMenu nickname={user.nickname} />
        </div>
      </div>
    </header>
  )
}
