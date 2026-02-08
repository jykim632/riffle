'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { AdminSidebarContent } from './sidebar'

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // 페이지 이동 시 Sheet 닫기
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">메뉴 열기</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">관리자 메뉴</SheetTitle>
          <AdminSidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
