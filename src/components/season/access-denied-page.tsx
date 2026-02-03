import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AccessDeniedPageProps {
  title: string
  message: string
  backHref?: string
  backLabel?: string
}

export function AccessDeniedPage({
  title,
  message,
  backHref = '/dashboard',
  backLabel = '대시보드로',
}: AccessDeniedPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
