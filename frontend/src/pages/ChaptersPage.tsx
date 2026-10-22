import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarClock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateTask, useResearch, useToggleTask, useUpdateChapter } from '@/services/researches'
import { ChapterStatusBadge } from '@/components/status-badge'
import { DatePicker } from '@/components/date-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
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
  { value: 'not_started', label: 'Belum mulai' },
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
  const [drafts, setDrafts] = useState<Record<number, { title: string; due: string }>>({})

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Bab-nya nggak bisa dimuat.</AlertDescription>
      </Alert>
    )
  }

  const submitTask = async (chapterId: number) => {
    const draft = drafts[chapterId]
    const title = draft?.title?.trim()
    if (!title) return
    try {
      await createTask.mutateAsync({ chapterId, title, due_date: draft.due || undefined })
      setDrafts((prev) => ({ ...prev, [chapterId]: { title: '', due: '' } }))
    } catch {
      toast.error('Tugasnya belum masuk. Coba lagi.')
    }
  }

  return (
    <div className="w-full space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Bab &amp; Tugas</h1>
        <p className="text-sm text-muted-foreground">
          Centang kalau tugasnya beres. Status bab terserah kamu, sesuai sejauh mana tulisannya jalan.
        </p>
      </header>

      <ul className="grid items-start gap-5 xl:grid-cols-2">
        {research?.chapters?.map((chapter) => {
          const draft = drafts[chapter.id] ?? { title: '', due: '' }
          return (
            <li key={chapter.id}>
              <Card>
                <CardHeader>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-medium text-muted-foreground">
                        {chapter.order}
                      </span>
                      <p className="text-base font-medium leading-none">{chapter.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChapterStatusBadge status={chapter.status} />
                      {(chapter.tasks?.length ?? 0) > 0 && chapter.tasks && (
                        <span className="text-xs text-muted-foreground">
                          {chapter.tasks.filter((t) => t.is_completed).length}/
                          {chapter.tasks.length} tugas
                        </span>
                      )}
                    </div>
                  </div>
                  <CardAction>
                    <Select
                      value={chapter.status}
                      onValueChange={(value) =>
                        updateChapter.mutate(
                          { chapterId: chapter.id, status: value as ChapterStatus },
                          { onError: () => toast.error('Status bab belum kesimpen.') },
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
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Progress value={chapter.progress_percent} aria-label={`Progres ${chapter.title}`} />
                    <span
                      className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground"
                      aria-live="polite"
                    >
                      {chapter.progress_percent}%
                    </span>
                  </div>

                  <ul className="flex flex-col gap-1">
                    {chapter.tasks?.map((task) => {
                      const overdue =
                        !task.is_completed &&
                        task.due_date !== null &&
                        new Date(`${task.due_date}T23:59:59`) < new Date()
                      return (
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
                            <span
                              className={`ml-auto flex shrink-0 items-center gap-1 font-mono text-[11px] ${
                                overdue ? 'text-status-revision' : 'text-muted-foreground'
                              }`}
                            >
                              <CalendarClock aria-hidden="true" className="size-3" />
                              {task.due_date}
                            </span>
                          )}
                        </li>
                      )
                    })}
                    {chapter.tasks?.length === 0 && (
                      <li className="text-sm text-muted-foreground">Belum ada tugas.</li>
                    )}
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
                        value={draft.title}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [chapter.id]: {
                              title: e.target.value,
                              due: prev[chapter.id]?.due ?? '',
                            },
                          }))
                        }
                        maxLength={255}
                        placeholder="Contoh: Revisi rumusan masalah"
                      />
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <Label htmlFor={`new-task-due-${chapter.id}`} className="sr-only">
                        Tenggat (opsional)
                      </Label>
                      <DatePicker
                        value={draft.due ? new Date(`${draft.due}T00:00:00`) : undefined}
                        onChange={(value) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [chapter.id]: {
                              title: prev[chapter.id]?.title ?? '',
                              due: value ? format(value, 'yyyy-MM-dd') : '',
                            },
                          }))
                        }
                        placeholder="Tenggat (opsional)"
                        ariaLabel={`Tenggat tugas ${chapter.title}`}
                        className="w-44"
                      />
                    </div>
                    <Button type="submit" variant="outline" disabled={createTask.isPending}>
                      <Plus data-icon="inline-start" aria-hidden="true" />
                      Tambah
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
