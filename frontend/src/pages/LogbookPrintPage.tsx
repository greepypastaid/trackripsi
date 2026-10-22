import { Link, Navigate, useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { useLogbook } from '@/services/literature'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

/**
 * Halaman cetak mandiri (tanpa sidebar) agar hasil print bersih.
 */
export function LogbookPrintPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data, isLoading, error } = useLogbook(id)

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="m-8 h-64" />
  if (error || !data) {
    return (
      <Alert variant="destructive" className="m-8">
        <AlertDescription>Logbooknya nggak bisa dimuat.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto w-full bg-background p-6 print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">
          {data.total} sesi tercatat · minimum {data.research.min_supervision_sessions} sesi
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/researches/${id}/guidance-logs`}>Kembali</Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Cetak
          </Button>
        </div>
      </div>

      <article className="space-y-4 text-black print:text-black dark:text-black">
        <header className="space-y-1 border-b pb-3 text-center">
          <h1 className="text-lg font-bold uppercase">Lembar Logbook Bimbingan Skripsi</h1>
          <p className="text-sm">{data.research.title}</p>
          <p className="text-xs">
            {data.research.faculty_field ?? '—'}
            {data.research.supervisor_name ? ` · Pembimbing: ${data.research.supervisor_name}` : ''}
          </p>
        </header>

        {data.total === 0 ? (
          <p className="text-sm">Belum ada sesi bimbingan yang tercatat.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted print:bg-transparent">
                <th className="border px-2 py-1 text-left">No</th>
                <th className="border px-2 py-1 text-left">Tanggal</th>
                <th className="border px-2 py-1 text-left">Bab</th>
                <th className="border px-2 py-1 text-left">Hasil bimbingan</th>
                <th className="border px-2 py-1 text-left">Tindak lanjut</th>
                <th className="border px-2 py-1 text-left">Paraf</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session) => (
                <tr key={session.number} className="break-inside-avoid">
                  <td className="border px-2 py-1 align-top">{session.number}</td>
                  <td className="border px-2 py-1 align-top whitespace-nowrap">
                    {session.meeting_date ? dateFmt.format(new Date(session.meeting_date)) : '—'}
                  </td>
                  <td className="border px-2 py-1 align-top">{session.chapters.length > 0 ? session.chapters.join(', ') : '—'}</td>
                  <td className="border px-2 py-1 align-top">{session.feedback_notes}</td>
                  <td className="border px-2 py-1 align-top">
                    {session.action_items.length > 0 ? (
                      <ul className="list-inside list-disc">
                        {session.action_items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="border px-2 py-1 align-top" />
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="pt-6 text-xs print:pt-10">
          <div className="flex justify-between gap-8">
            <div className="text-center">
              <p>Mahasiswa</p>
              <div className="h-14" />
              <p className="border-t px-8 pt-1">____________________</p>
            </div>
            <div className="text-center">
              <p>Dosen Pembimbing</p>
              <div className="h-14" />
              <p className="border-t px-8 pt-1">
                {data.research.supervisor_name ?? '____________________'}
              </p>
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}
