import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { DatePicker } from '@/components/date-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateResearch, useDeleteResearch, useUpdateResearch } from '@/services/researches'
import { ApiError } from '@/services/api'
import type { Research } from '@/services/types'

/** Kelola riset: satu form untuk buat dan edit, satu dialog konfirmasi untuk hapus. */
export function ResearchFormDialog({
  open,
  onOpenChange,
  research,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  research?: Research | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* DialogContent unmount saat tertutup, jadi state form selalu mulai dari data terbaru. */}
        <ResearchForm research={research ?? null} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function ResearchForm({ research, onDone }: { research: Research | null; onDone: () => void }) {
  const navigate = useNavigate()
  const createResearch = useCreateResearch()
  const updateResearch = useUpdateResearch()
  const editing = research !== null

  const [form, setForm] = useState({
    title: research?.title ?? '',
    field: research?.faculty_field ?? '',
    supervisor: research?.supervisor_name ?? '',
    target: research?.target_completion_date ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  const pending = createResearch.isPending || updateResearch.isPending

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const body = {
      title: form.title.trim(),
      faculty_field: form.field.trim() || null,
      supervisor_name: form.supervisor.trim() || null,
      target_completion_date: form.target || null,
    }

    try {
      if (research) {
        await updateResearch.mutateAsync({ id: research.id, ...body })
        toast.success('Perubahan tersimpan.')
        onDone()
        return
      }

      const created = await createResearch.mutateAsync(body)
      toast.success('Riset dibuat', { description: `${created.title} siap dikerjakan.` })
      onDone()
      navigate(`/researches/${created.id}/overview`)
    } catch (err) {
      const message = err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : 'Risetnya belum tersimpan. Coba lagi.'
      setError(message)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit riset' : 'Buat riset baru'}</DialogTitle>
        <DialogDescription>
          {editing
            ? 'Ubah judul, bidang, pembimbing, atau target selesainya.'
            : 'Bab 1 sampai Bab 5 udah disiapin, kamu tinggal isi.'}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="research-title">Judul skripsi</Label>
        <Input
          id="research-title"
          required
          maxLength={500}
          autoFocus
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="research-field">Bidang studi (opsional)</Label>
        <Input
          id="research-field"
          maxLength={255}
          value={form.field}
          onChange={(e) => setForm((prev) => ({ ...prev, field: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="research-supervisor">Nama pembimbing (opsional)</Label>
        <Input
          id="research-supervisor"
          maxLength={255}
          value={form.supervisor}
          onChange={(e) => setForm((prev) => ({ ...prev, supervisor: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="research-target">Target selesai (opsional)</Label>
        <DatePicker
          value={form.target ? new Date(`${form.target}T00:00:00`) : undefined}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, target: value ? format(value, 'yyyy-MM-dd') : '' }))
          }
          ariaLabel="Target selesai"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Simpan riset'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function DeleteResearchDialog({
  research,
  onOpenChange,
  onDeleted,
}: {
  research: Research | null
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}) {
  const remove = useDeleteResearch()

  const confirm = async () => {
    if (!research) return
    try {
      await remove.mutateAsync(research.id)
      toast.success('Riset dihapus.')
      onOpenChange(false)
      onDeleted?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Risetnya belum bisa dihapus.')
    }
  }

  return (
    <Dialog open={research !== null} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus riset ini?</DialogTitle>
          <DialogDescription>
            “{research?.title}” akan hilang bersama semua bab, tugas, draf berkas, log bimbingan,
            literatur, dan catatannya. Tindakan ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending ? 'Menghapus…' : 'Ya, hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
