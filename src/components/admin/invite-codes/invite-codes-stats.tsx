import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface InviteCodesStatsProps {
  total: number
  used: number
  unused: number
}

export function InviteCodesStats({ total, used, unused }: InviteCodesStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            전체
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{total}개</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            사용됨
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground">{used}개</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-600">미사용</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{unused}개</p>
        </CardContent>
      </Card>
    </div>
  )
}
