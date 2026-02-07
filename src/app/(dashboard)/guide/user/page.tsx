import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PenLine, LayoutDashboard, List, Settings } from 'lucide-react'

export default function UserGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">사용자 가이드</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Riffle 서비스 이용 방법 안내
        </p>
      </div>

      <div className="space-y-6">
        {/* 대시보드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              대시보드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              로그인하면 바로 보이는 메인 화면입니다.
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><span className="font-medium text-foreground">이번 주 현황</span> — 현재 주차 정보, 기간, 내 제출 여부</li>
              <li><span className="font-medium text-foreground">멤버 제출 현황</span> — 누가 제출했는지 한눈에 확인</li>
              <li><span className="font-medium text-foreground">이번 주 요약본</span> — 다른 멤버들이 올린 요약본 미리보기</li>
            </ul>
          </CardContent>
        </Card>

        {/* 요약본 작성 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              요약본 작성
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">작성 방법</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                <li>상단 메뉴에서 <span className="font-medium text-foreground">새 요약본</span> 클릭</li>
                <li>제출 주차 선택 (현재 주차가 기본 선택)</li>
                <li>마크다운 에디터로 요약본 작성</li>
                <li><span className="font-medium text-foreground">제출하기</span> 클릭</li>
              </ol>
            </div>
            <div>
              <h3 className="mb-2 font-medium">마크다운 문법</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 font-medium">문법</th>
                      <th className="pb-2 font-medium">결과</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs"># 제목</td>
                      <td className="py-2">큰 제목</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">## 소제목</td>
                      <td className="py-2">소제목</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">**굵게**</td>
                      <td className="py-2 font-bold">굵게</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">*기울임*</td>
                      <td className="py-2 italic">기울임</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">- 항목</td>
                      <td className="py-2">목록 항목</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">[텍스트](URL)</td>
                      <td className="py-2">링크</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-medium">참고 사항</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>최소 10자 이상, 최대 10,000자까지 작성 가능</li>
                <li>오른쪽 미리보기로 결과를 확인하며 작성 가능</li>
                <li>제출 후에도 수정 가능</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 요약본 조회 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              요약본 조회
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">게시판</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>전체 멤버의 요약본을 주차별로 필터링해서 조회</li>
                <li>다른 멤버의 요약본을 읽고 비교</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">내 제출</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>본인이 제출한 요약본만 모아보기</li>
                <li>수정이 필요한 요약본 선택 후 수정 가능</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 시즌 시스템 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              시즌 시스템
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>스터디는 시즌 단위로 운영됩니다</li>
              <li>시즌마다 멤버 구성이 달라질 수 있습니다</li>
              <li>주차는 매주 월요일~일요일 기준으로 구분됩니다</li>
              <li>초대 코드는 1회용이며, 본인에게 배정된 코드를 사용해주세요</li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          문의사항은 스터디 단톡방에서 연락해주세요.
        </p>
      </div>
    </div>
  )
}
