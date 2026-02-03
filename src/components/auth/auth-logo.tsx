import { Radio } from 'lucide-react'

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Radio className="h-6 w-6 text-white" />
        </div>
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
