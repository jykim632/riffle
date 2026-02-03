import { AuthLogo } from '@/components/auth/auth-logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="relative w-full max-w-md px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AuthLogo />
        {children}
      </div>
    </div>
  )
}
