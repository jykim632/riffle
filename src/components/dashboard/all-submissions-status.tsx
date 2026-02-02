import { Users, CheckCircle2, Circle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AllSubmissionsStatusProps {
  submissions: Array<{
    nickname: string
    has_submitted: boolean
  }>
}

export function AllSubmissionsStatus({
  submissions,
}: AllSubmissionsStatusProps) {
  const totalMembers = submissions.length
  const submittedCount = submissions.filter((s) => s.has_submitted).length

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          전체 제출 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold sm:text-3xl">{submittedCount}</span>
          <span className="text-xs text-muted-foreground sm:text-sm">
            / {totalMembers}명 제출
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {submissions.map((member) => (
            <Badge
              key={member.nickname}
              variant={member.has_submitted ? 'default' : 'secondary'}
              className="gap-1 text-xs sm:text-sm"
            >
              {member.has_submitted ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              {member.nickname}
            </Badge>
          ))}
        </div>

        {submissions.length === 0 && (
          <div className="py-4 text-center text-xs text-muted-foreground sm:text-sm">
            아직 멤버가 없습니다
          </div>
        )}
      </CardContent>
    </Card>
  )
}
