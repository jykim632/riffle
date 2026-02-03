import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function NonMemberAlert() {
  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle>시즌 참여자가 아닙니다</AlertTitle>
      <AlertDescription>
        현재 시즌에 참여하지 않았습니다. 요약본을 제출하려면 관리자에게 문의하세요.
      </AlertDescription>
    </Alert>
  )
}
