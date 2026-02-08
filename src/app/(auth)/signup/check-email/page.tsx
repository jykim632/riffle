'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
      <CardHeader className="space-y-1 pb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50">
          <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">인증 메일을 확인해주세요</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          {email ? (
            <>
              <span className="font-medium text-foreground">{email}</span>
              <span>로 인증 메일을 발송했습니다.</span>
            </>
          ) : (
            '입력하신 이메일로 인증 메일을 발송했습니다.'
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          메일의 인증 링크를 클릭하면 가입이 완료됩니다.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-2">
        <Button
          asChild
          variant="outline"
          className="w-full h-10 text-sm font-medium border-2 hover:bg-muted/50 hover:border-muted-foreground/40 transition-all duration-200"
        >
          <Link href="/login">로그인 페이지로 이동</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  )
}
