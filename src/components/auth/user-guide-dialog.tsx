'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BookOpen, UserPlus, FileText, HelpCircle } from 'lucide-react'

export function UserGuideDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline cursor-pointer"
      >
        처음이신가요? 사용 가이드 보기
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Riffle 사용 가이드
            </DialogTitle>
            <DialogDescription>
              처음 오신 분들을 위한 안내입니다
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto space-y-5 pr-1">
            {/* 서비스 소개 */}
            <section>
              <p className="text-sm text-muted-foreground leading-relaxed rounded-lg bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 p-3 border border-blue-100 dark:border-blue-900/50">
                <strong className="text-foreground">Riffle</strong>은 매주 경제 라디오 요약본을 제출하고 관리하는{' '}
                <strong className="text-foreground">폐쇄형 스터디</strong>입니다.
              </p>
            </section>

            {/* 이용 방법 */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-violet-600" />
                이용 방법
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>스터디 관리자에게 <strong className="text-foreground">초대 코드</strong>를 받으세요</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>초대 코드로 <strong className="text-foreground">회원가입</strong> 후 이메일 인증</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>매주 라디오 요약본을 <strong className="text-foreground">작성·제출</strong></span>
                </li>
              </ol>
            </section>

            {/* FAQ */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                자주 묻는 질문
              </h3>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    초대 코드는 어디서 받나요?
                  </p>
                  <p className="text-muted-foreground pl-5">
                    스터디 관리자에게 문의하세요.
                  </p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    비밀번호를 잊었어요
                  </p>
                  <p className="text-muted-foreground pl-5">
                    로그인 화면의 &ldquo;비밀번호를 잊으셨나요?&rdquo;를 클릭하세요.
                  </p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Google 계정으로도 가입할 수 있나요?
                  </p>
                  <p className="text-muted-foreground pl-5">
                    네, 초대 코드 입력 후 Google 로그인이 가능합니다.
                  </p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Google 로그인 시 낯선 주소가 뜨는데 안전한가요?
                  </p>
                  <p className="text-muted-foreground pl-5">
                    Google 로그인 과정에서 <strong className="text-foreground">supabase.co</strong> 주소가 잠깐 표시될 수 있습니다.
                    이는 Riffle이 사용하는 공식 인증 서비스(Supabase)로, 안전하니 걱정하지 않으셔도 됩니다.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
