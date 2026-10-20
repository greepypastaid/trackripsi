import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Copy, GraduationCap, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useDefenseQuestions, useSaveDefenseAnswer } from '@/services/literature'
import type { DefenseQuestion } from '@/services/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const CATEGORY_LABEL: Record<DefenseQuestion['category'], string> = {
  motivasi: 'Motivasi',
  kebaruan: 'Kebaruan',
  metode: 'Metode',
  sampling: 'Sampling',
  teori: 'Teori',
  hasil: 'Hasil',
}

export function DefensePage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: questions = [], isLoading, error } = useDefenseQuestions(id)

  const [chapter, setChapter] = useState('all')
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [answerVersion, setAnswerVersion] = useState(0)

  const visible = useMemo(
    () =>
      chapter === 'all'
        ? questions
        : questions.filter((q) => String(q.chapter_order) === chapter),
    [questions, chapter],
  )

  const ready = questions.filter((q) => q.is_ready).length
  const progress = questions.length ? Math.round((ready / questions.length) * 100) : 0

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Gagal memuat bank pertanyaan sidang.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pertanyaan Sidang</h1>
          <p className="text-sm text-muted-foreground">
            Siapkan jawaban per pertanyaan penguji; tandai siap bila sudah bisa dijelaskan lancar.
          </p>
        </div>
        <Select value={chapter} onValueChange={setChapter}>
          <SelectTrigger className="w-48" aria-label="Filter bab">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua bab</SelectItem>
            {[1, 2, 3, 4, 5].map((order) => (
              <SelectItem key={order} value={String(order)}>
                Bab {order}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap aria-hidden="true" className="size-4 text-primary" />
            Kesiapan jawaban
          </CardTitle>
          <CardDescription>
            {ready} dari {questions.length} pertanyaan ditandai siap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} aria-label="Kesiapan jawaban sidang" />
        </CardContent>
      </Card>

      <ul className="flex flex-col gap-3">
        {visible.map((question) => (
          <li key={question.id}>
            <AnswerCard
              key={`${question.id}-${answerVersion}`}
              researchId={id}
              question={question}
              draft={drafts[question.id]}
              onDraft={(value) => setDrafts((prev) => ({ ...prev, [question.id]: value }))}
              onSaved={() => setAnswerVersion((value) => value + 1)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function AnswerCard({
  researchId,
  question,
  draft,
  onDraft,
  onSaved,
}: {
  researchId: number
  question: DefenseQuestion
  draft?: string
  onDraft: (value: string) => void
  onSaved: () => void
}) {
  const save = useSaveDefenseAnswer(researchId)
  const value = draft ?? question.answer ?? ''

  const submit = (isReady: boolean) => {
    save.mutate(
      { questionId: question.id, answer: value, is_ready: isReady },
      {
        onSuccess: () => {
          toast.success(isReady ? 'Ditandai siap.' : 'Jawaban disimpan.')
          onSaved()
        },
        onError: () => toast.error('Gagal menyimpan jawaban.'),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base font-medium">
          <Badge variant="outline">Bab {question.chapter_order ?? '–'}</Badge>
          <Badge variant="secondary">{CATEGORY_LABEL[question.category]}</Badge>
          {question.is_ready && (
            <Badge className="bg-status-done/10 text-status-done border-transparent">Siap</Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm text-foreground">{question.text}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={value}
          onChange={(e) => onDraft(e.target.value)}
          rows={3}
          placeholder="Tulis poin jawaban Anda…"
          aria-label={`Jawaban untuk: ${question.text}`}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => submit(question.is_ready)} disabled={save.isPending}>
            <Save aria-hidden="true" />
            Simpan
          </Button>
          {!question.is_ready && (
            <Button size="sm" variant="outline" onClick={() => submit(true)} disabled={save.isPending}>
              Tandai siap
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(question.text)
                toast.success('Pertanyaan disalin.')
              } catch {
                toast.error('Gagal menyalin.')
              }
            }}
          >
            <Copy aria-hidden="true" />
            Salin pertanyaan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
