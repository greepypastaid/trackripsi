import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateTask, useResearch, useToggleTask, useUpdateChapter } from '@/services/researches'
import { ChapterStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChapterStatus } from '@/services/types'

const STATUSES: { value: ChapterStatus; label: string }[] = [
  { value: 'not_started', label: 'Belum Mulai' },
  { value: 'in_progress', label: 'Dikerjakan' },
  { value: 'revision', label: 'Revisi' },
  { value: 'completed', label: 'Selesai' },
]

export function ChaptersPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const toggleTask = useToggleTask(id)
  const createTask = useCreateTask(id)
  const updateChapter = useUpdateChapter(id)
  const [draft, setDraft] = useState<Record<number, string>>({})

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Gagal memuat bab riset.</AlertDescription>
      </Alert>
    )
  }

  const submitTask = async (chapterId: number) => {
    const title = draft[chapterId]?.trim()
    if (!title) return
    try {
      await createTask.mutateAsync({ chapterId, title })
      setDraft((prev) => ({ ...prev, [chapterId]: '' }))
    } catch {
      toast.error('Gagal menambah tugas.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Bab &amp; Tugas</h1>

      {research?.chapters?.map((chapter) => (
        <Card key={chapter.id}>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <p className="text-base font-medium leading-none">{chapter.title}</p>
              <ChapterStatusBadge status={chapter.status} />
            </div>
            <Select
              value={chapter.status}
              onValueChange={(value) =>
                updateChapter.mutate(
                  { chapterId: chapter.id, status: value as ChapterStatus },
                  { onError: () => toast.error('Gagal mengubah status bab.') },
                )
              }
            >
              <SelectTrigger className="w-36" aria-label={`Ubah status ${chapter.title}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Progress value={chapter.progress_percent} aria-label={`Progres ${chapter.title}`} />
              <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground" aria-live="polite">
                {chapter.progress_percent}%
              </span>
            </div>

            <ul className="flex flex-col gap-1">
              {chapter.tasks?.map((task) => (
                <li key={task.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.is_completed}
                    onCheckedChange={() => toggleTask.mutate(task)}
                  />
                  <Label
                    htmlFor={`task-${task.id}`}
                    className={
                      task.is_completed
                        ? 'font-normal text-muted-foreground line-through'
                        : 'font-normal text-foreground'
                    }
                  >
                    {task.title}
                  </Label>
                  {task.due_date && (
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{task.due_date}</span>
                  )}
                </li>
              ))}
              {chapter.tasks?.length === 0 && <li className="text-sm text-muted-foreground">Belum ada tugas.</li>}
            </ul>

            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void submitTask(chapter.id)
              }}
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`new-task-${chapter.id}`} className="sr-only">
                  Tugas baru untuk {chapter.title}
                </Label>
                <Input
                  id={`new-task-${chapter.id}`}
                  value={draft[chapter.id] ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [chapter.id]: e.target.value }))}
                  maxLength={255}
                  placeholder="Contoh: Revisi rumusan masalah"
                />
              </div>
              <Button type="submit" variant="outline" disabled={createTask.isPending}>
                <Plus data-icon="inline-start" aria-hidden="true" />
                Tambah
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
