import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SummaryContentProps {
  content: string
}

export function SummaryContent({ content }: SummaryContentProps) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
