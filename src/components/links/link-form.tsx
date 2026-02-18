'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { createSharedLink } from '@/actions/shared-links'
import { LINK_CATEGORY_LABELS, type LinkCategory } from '@/lib/schemas/shared-link'

export function LinkForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)

    const result = await createSharedLink(formData)

    if (result && 'error' in result) {
      setError(result.error ?? '알 수 없는 오류가 발생했습니다.')
    } else {
      formRef.current?.reset()
    }

    setPending(false)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              name="title"
              placeholder="제목"
              required
              maxLength={200}
              className="sm:flex-1"
            />
            <Select name="category" defaultValue="article">
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(LINK_CATEGORY_LABELS) as [LinkCategory, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <Input
            name="url"
            type="url"
            placeholder="https://..."
            required
          />
          <Input
            name="comment"
            placeholder="한줄 코멘트 (선택)"
            maxLength={300}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            <Plus className="mr-1 h-4 w-4" />
            {pending ? '공유 중...' : '공유하기'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
