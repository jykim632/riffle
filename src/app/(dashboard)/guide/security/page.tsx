import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, Database, Globe } from 'lucide-react'

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">보안 안내</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          데이터 수집 범위, 접근 권한, 보호 정책 안내
        </p>
      </div>

      <div className="space-y-6">
        {/* 수집 데이터 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              수집하는 데이터
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">계정 정보</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>이메일 주소 — 로그인용</li>
                <li>비밀번호 — 암호화 저장 (원본 저장 안 함)</li>
                <li>닉네임 — 서비스 내 표시명</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">서비스 이용 데이터</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>요약본 내용 및 제출 시각</li>
                <li>시즌/주차 참여 기록</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">웹 분석 (Vercel Analytics)</h3>
              <p className="text-sm text-muted-foreground">
                페이지 조회 수, 방문자 수 등 익명화된 통계를 수집합니다.
                개인을 특정할 수 있는 정보는 수집하지 않습니다.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium">수집하지 않는 것</h3>
              <p className="text-sm text-muted-foreground">
                IP 주소, 위치 정보, 기기/브라우저 정보, 결제 정보, 검색 기록
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 데이터 접근 범위 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              데이터 접근 범위
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">모든 멤버가 볼 수 있는 것</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>다른 멤버의 닉네임, 제출된 요약본, 제출 현황</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium">본인만 할 수 있는 것</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>본인 요약본 수정/삭제</li>
                  <li>본인 제출 내역 조회</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium">관리자만 할 수 있는 것</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>초대 코드 생성/관리, 시즌/주차 관리, 멤버 관리</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 보안 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              데이터 보호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>비밀번호는 bcrypt 해시로 암호화 저장</li>
              <li>데이터베이스 수준 접근 제어 (Row Level Security)</li>
              <li>세션은 암호화된 쿠키로 관리</li>
              <li>클릭재킹, MIME 스니핑 등 웹 공격 방지 헤더 적용</li>
            </ul>
          </CardContent>
        </Card>

        {/* 보관 및 삭제 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              데이터 보관 및 삭제
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">보관 기간</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>계정 정보 및 요약본은 서비스 이용 기간 동안 보관됩니다</li>
                <li>시즌 종료 후에도 해당 시즌의 요약본은 유지됩니다</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">계정 삭제 시 처리</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>계정 정보(이메일, 비밀번호)와 프로필은 완전히 삭제됩니다</li>
                <li>
                  요약본은 스터디 공유 자산으로 내용이 보존되며, 작성자는
                  &quot;탈퇴한 멤버&quot;로 표시됩니다
                </li>
                <li>시즌 참여 기록은 정책 확정 중입니다</li>
                <li>초대 코드 이력은 익명화됩니다</li>
                <li>탈퇴 후 요약본은 수정/삭제가 불가합니다</li>
                <li>계정 삭제를 원할 경우 관리자에게 문의해주세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 제3자 서비스 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              제3자 서비스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">서비스</th>
                    <th className="pb-2 pr-4 font-medium">용도</th>
                    <th className="pb-2 font-medium">데이터 범위</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Supabase</td>
                    <td className="py-2 pr-4">데이터베이스, 인증</td>
                    <td className="py-2">계정 정보, 서비스 데이터</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Vercel</td>
                    <td className="py-2 pr-4">웹 호스팅</td>
                    <td className="py-2">웹 분석 (익명화)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Google OAuth</td>
                    <td className="py-2 pr-4">소셜 로그인</td>
                    <td className="py-2">이메일, 이름</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          데이터 관련 문의사항은 스터디 운영자에게 연락해주세요.
        </p>
      </div>
    </div>
  )
}
