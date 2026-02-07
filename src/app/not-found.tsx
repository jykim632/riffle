import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">페이지를 찾을 수 없어요</h2>
        <p className="mb-6 text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었어요.
        </p>
        <Button asChild>
          <Link href="/dashboard">대시보드로 돌아가기</Link>
        </Button>
      </div>
    </div>
  )
}
