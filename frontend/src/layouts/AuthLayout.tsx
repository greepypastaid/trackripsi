import { BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

const HIGHLIGHTS = [
  'Template Bab 1–5 otomatis untuk setiap riset baru',
  'Checklist tugas dan log bimbingan dalam satu tempat',
  'Riwayat versi berkas draf per bab',
]

const YEAR = new Date().getFullYear()

export function AuthLayout({
  children,
  footer,
}: {
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="relative grid min-h-svh lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Panel brand — hanya tampil di layar besar */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-white/25 blur-3xl" />
          <div className="absolute right-[-15%] bottom-[-25%] size-[30rem] rounded-full bg-white/15 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground text-primary">
            <BookOpen aria-hidden="true" className="size-5" />
          </span>
          Skripsi Manager
        </div>

        <div className="relative max-w-md space-y-5">
          <h1 className="text-3xl leading-tight font-bold tracking-tight">
            Selesaikan skripsi, satu bab dalam satu waktu.
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/80">
            Kelola seluruh perjalanan tugas akhir Anda — mulai dari bab, tugas, bimbingan, hingga
            berkas draf — di satu tempat.
          </p>
          <ul className="space-y-2.5 text-sm">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary-foreground/25 text-[10px] font-bold"
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {YEAR} Skripsi Manager
        </p>
      </section>

      {/* Area form */}
      <section className="flex flex-col items-center justify-center gap-6 px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-1.5 text-center lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen aria-hidden="true" className="size-5" />
            </span>
          </div>
          {children}
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </section>
    </main>
  )
}
