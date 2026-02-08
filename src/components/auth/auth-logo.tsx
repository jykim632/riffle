import Image from 'next/image'

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Riffle 로고"
          width={40}
          height={40}
          className="dark:invert"
          priority
        />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          Riffle
        </h1>
      </div>
      <p className="text-xs text-muted-foreground text-center font-medium">
        경제 라디오 스터디
      </p>
    </div>
  )
}
