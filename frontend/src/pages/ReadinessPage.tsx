import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CalendarClock, CircleAlert, CircleCheck, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useReadiness, useUpdateReadinessChecklist } from '@/services/literature'
import { useResearch } from '@/services/researches'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function ReadinessPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research } = useResearch(id)
  const { data: readiness, isLoading, error } = useReadiness(id)
  const updateChecklist = useUpdateReadinessChecklist(id)

  const [label, setLabel] = useState('')
  const [confirm, setConfirm] = useState<null | {
    title: string
    description: string
    run: () => void
  }>(null)
  const checklist = research?.readiness_checklist ?? []

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error || !readiness) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Status kesiapan sidangnya nggak bisa dimuat.</AlertDescription>
      </Alert>
    )
  }

  const save = (next: Array<{ label: string; done: boolean }>) => {
    updateChecklist.mutate(next, {
      onError: () => toast.error('Checklistnya belum kesimpen.'),
    })
  }

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Kesiapan Sidang</h1>
        <p className="text-sm text-muted-foreground">
          Skor naik bertahap tiap bab selesai, draf diunggah, sesi bimbingan tercatat, dan sumber
          masuk daftar pustaka. Yang perlu kamu isi sendiri cuma checklist kampus.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle>Skor kesiapan</CardTitle>
              <CardDescription>Seberapa banyak syarat yang udah beres.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-5xl font-bold" aria-live="polite">
                {readiness.score}%
              </p>
              <Progress value={readiness.score} aria-label="Skor kesiapan sidang" />

              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground">Rincian penilaian</p>
                <ul className="space-y-2">
                  {readiness.checks.map((check) => (
                    <li key={check.key} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5">
                          {check.progress >= 1 ? (
                            <CircleCheck aria-hidden="true" className="size-3.5 text-status-done" />
                          ) : (
                            <CircleAlert
                              aria-hidden="true"
                              className="size-3.5 text-status-revision"
                            />
                          )}
                          {check.label}
                          <span className="text-muted-foreground">({check.weight}%)</span>
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {Math.round(check.progress * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={check.progress * 100}
                        aria-label={`Progres ${check.label}`}
                        className="h-1"
                      />
                      <p className="text-[0.7rem] text-muted-foreground">{check.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <CalendarClock aria-hidden="true" className="size-3" />
                {readiness.stats.upcoming_appointments} jadwal bimbingan mendatang ·{' '}
                {readiness.stats.open_action_items} poin revisi terbuka
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist kampus</CardTitle>
              <CardDescription>Syarat administratif yang nggak kebaca dari data riset.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {checklist.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada butir. Tambahin syarat dari kampusmu.</p>
              )}
              <ul className="flex flex-col gap-2">
                {checklist.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                    <input
                      id={`checklist-${index}`}
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => {
                        const next = checklist.map((entry, i) =>
                          i === index ? { ...entry, done: e.target.checked } : entry,
                        )
                        save(next)
                      }}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <label htmlFor={`checklist-${index}`} className="flex-1 text-sm">
                      {item.label}
                    </label>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Hapus butir ${item.label}`}
                      onClick={() =>
                        setConfirm({
                          title: 'Hapus butir ini?',
                          description: `“${item.label}” bakal hilang dari checklist kesiapan.`,
                          run: () => save(checklist.filter((_, i) => i !== index)),
                        })
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const trimmed = label.trim()
                  if (!trimmed) return
                  save([...checklist, { label: trimmed, done: false }])
                  setLabel('')
                }}
                className="flex gap-2"
              >
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Bebas plagiasi, TOEFL…"
                  aria-label="Butir checklist baru"
                />
                <Button type="submit" size="icon" aria-label="Tambah butir" disabled={updateChecklist.isPending}>
                  <Plus aria-hidden="true" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
              Yang masih menghalangi ({readiness.blockers.length})
            </CardTitle>
            <CardDescription>Diurutin dari prasyarat bab sampai target waktu.</CardDescription>
          </CardHeader>
          <CardContent>
            {readiness.blockers.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-status-done">
                <CircleCheck aria-hidden="true" className="size-4" />
                Semua syarat beres. Kamu siap daftar sidang.
              </p>
            ) : (
              <ul className="divide-y">
                {readiness.blockers.map((blocker) => (
                  <li key={blocker.key} className="flex items-start gap-3 py-3">
                    <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-status-revision" />
                    <div>
                      <p className="text-sm font-medium">{blocker.label}</p>
                      <p className="text-xs text-muted-foreground">{blocker.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        pending={updateChecklist.isPending}
        onConfirm={() => {
          confirm?.run()
          setConfirm(null)
        }}
      />

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Save aria-hidden="true" className="size-3" />
        Checklist kesimpen otomatis tiap kamu ubah.
      </p>
    </div>
  )
}
