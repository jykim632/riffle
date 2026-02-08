'use client'

import Link from 'next/link'
import { User, LogOut, KeyRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/actions/auth'

interface UserMenuProps {
  nickname: string
  hasPassword?: boolean
}

export function UserMenu({ nickname, hasPassword = false }: UserMenuProps) {
  const handleLogout = async () => {
    await logout()
  }

  // 닉네임 첫 글자를 아바타 이니셜로 사용
  const initial = nickname.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground sm:text-sm">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{nickname}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 sm:w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="truncate">{nickname}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasPassword && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/settings/password">
              <KeyRound className="mr-2 h-4 w-4" />
              비밀번호 변경
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
