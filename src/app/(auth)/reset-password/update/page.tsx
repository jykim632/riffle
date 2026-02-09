import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UpdatePasswordForm } from './update-password-form'

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/reset-password?error=' + encodeURIComponent('비밀번호 초기화 링크를 통해 접근해주세요.'))
  }

  return <UpdatePasswordForm />
}
