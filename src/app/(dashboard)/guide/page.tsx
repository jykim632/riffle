import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, BookOpen } from 'lucide-react'

export default function GuideIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">가이드</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Riffle 서비스 이용 안내
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/guide/user" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                사용자 가이드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                요약본 작성, 제출, 조회 등 서비스 이용 방법을 안내합니다.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/guide/security" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                보안 안내
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                데이터 수집 범위, 접근 권한, 보호 정책을 안내합니다.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
