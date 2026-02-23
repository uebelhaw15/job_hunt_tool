import { useState } from 'react'
import { ChevronDown, ChevronUp, Bot } from 'lucide-react'
import { type Question } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  question: Question
  onEdit: () => void
  onDelete: () => void
  onCopy?: () => void  // optional — only shown in bank context
}

export function QuestionCard({ question, onEdit, onDelete, onCopy }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{question.category}</span>
            {question.aiGenerated && (
              <span className="inline-flex items-center gap-0.5 text-xs text-violet-500">
                <Bot size={11} /> AI
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800">{question.question}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onCopy && <Button variant="ghost" size="sm" onClick={onCopy}>Copy to job</Button>}
          <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button>
          {(question.answer || question.notes) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className={cn('mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2')}>
          {question.answer && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Answer</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{question.answer}</p>
            </div>
          )}
          {question.notes && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Notes</p>
              <p className="text-sm text-slate-500 whitespace-pre-wrap">{question.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
