import { useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Download, FileUp } from 'lucide-react'
import { toast } from 'sonner'
import { useResearch, useUploadDraft } from '@/services/researches'
import { EmptyState } from '@/components/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const MAX_BYTES = 15 * 1024 * 1024

export function DocumentsPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const upload = useUploadDraft(id)
  const inputRef = useRef<HTMLInputElement>(null)
  const [chapterId, setChapterId] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Gagal memuat berkas draf.</AlertDescription>
      </Alert>
    )
  }

  const chapters = research?.chapters ?? []
  const drafts = chapters.flatMap((chapter) =>
    (chapter.drafts ?? []).map((draft) => ({ ...draft, chapterTitle: chapter.title })),
  )
  const target = chapterId || String(chapters[0]?.id ?? '')

  const handleFile = (file: File | undefined) => {
    setFileError(null)
    if (!file) return
    if (file.size > MAX_BYTES) {
      setFileError('Berkas melebihi batas 15 MB.')
      return
    }
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      setFileError('Hanya berkas PDF atau DOC/DOCX yang diizinkan.')
      return
    }
    if (!target) return
    upload.mutate(
      { chapterId: Number(target), file },
      {
        onSuccess: () => toast.success('Draf berhasil diunggah.'),
        onError: () => setFileError('Gagal mengunggah. Pastikan format dan ukuran berkas sesuai.'),
      },
    )
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Berkas Draf</h1>

      <Card>
        <CardHeader>
          <CardTitle>Unggah draf</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex max-w-sm flex-col gap-2">
            <Label htmlFor="upload-chapter">Simpan ke bab</Label>
            <Select value={target} onValueChange={setChapterId}>
              <SelectTrigger id="upload-chapter" className="w-full">
                <SelectValue placeholder="Pilih bab" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label
            htmlFor="draft-file"
            className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-input bg-background p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/50 focus-within:ring-3 focus-within:ring-ring/50"
          >
            <FileUp aria-hidden="true" className="size-5 text-primary" />
            <span>
              <span className="font-medium text-foreground">Pilih berkas</span> atau seret ke sini
            </span>
            <span className="text-xs">PDF atau DOC/DOCX, maksimal 15 MB</span>
            <input
              ref={inputRef}
              id="draft-file"
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>

          {upload.isPending && <p className="text-sm text-muted-foreground">Mengunggah…</p>}
          {fileError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {fileError}
            </p>
          )}
        </CardContent>
      </Card>

      <section aria-label="Daftar draf" className="space-y-3">
        <h2 className="text-xl font-semibold">Riwayat versi</h2>
        {drafts.length === 0 && (
          <EmptyState
            icon={FileUp}
            title="Belum ada berkas draf"
            description="Unggah draf bab pertama Anda untuk mulai melacak riwayat versi naskah."
          />
        )}
        <ul className="flex flex-col gap-2">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Card size="sm">
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="font-mono">
                    {draft.version_label}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{draft.file_name}</p>
                    <p className="text-xs text-muted-foreground">{draft.chapterTitle}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {(draft.file_size_bytes / 1024).toFixed(0)} KB
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const { apiRaw } = await import('@/services/download')
                      await apiRaw(draft.download_url, draft.file_name)
                    }}
                  >
                    <Download data-icon="inline-start" aria-hidden="true" />
                    Unduh
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
