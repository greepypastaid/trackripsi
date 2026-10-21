import { BookOpen, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

const HIGHLIGHTS = [
  'Template Bab 1–5 otomatis untuk setiap riset baru',
  'Checklist tugas dan log bimbingan per riset',
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
    <main className="relative grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      {/* Panel brand — hanya tampil di layar besar */}
      <section className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-[oklch(0.42_0.2_285)] p-14 text-primary-foreground lg:flex xl:p-16">
        {/* Tekstur: garis grid halus + dua blok cahaya lembut */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:2.75rem_2.75rem]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-24 size-[30rem] rounded-full bg-white/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -bottom-44 size-[34rem] rounded-full bg-[#c4b5fd]/25 blur-3xl" />

        <div className="relative flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <BookOpen aria-hidden="true" className="size-5" />
          </span>
          Trackripsi
        </div>

        {/* Blok pesan dipusatkan vertikal dengan napas yang lega */}
        <div className="relative my-auto max-w-md space-y-7 py-20">
          <h1 className="text-4xl leading-[1.12] font-bold tracking-tight xl:text-5xl xl:leading-[1.1]">
            Selesaikan skripsi bab demi bab.
          </h1>
          <p className="text-base leading-relaxed text-white/80">
            Bab, tugas, log bimbingan, dan berkas draf riset Anda semuanya
            tertib di satu aplikasi.
          </p>
          <ul className="space-y-3.5 text-sm">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white/90"
                >
                  <Check aria-hidden="true" className="size-3" strokeWidth={3.5} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {YEAR} Trackripsi
        </p>
      </section>

      {/* Area form */}
      <section className="relative flex min-h-svh flex-col px-8 py-10 sm:px-14 lg:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(46rem_32rem_at_85%_-10%,var(--color-primary-100)_0%,transparent_60%)] dark:opacity-15"
        />

        {/* Header mobile + tablet */}
        <div className="relative flex flex-col items-center gap-2.5 pt-16 text-center lg:hidden">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary-600/25">
            <BookOpen aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Trackripsi</span>
        </div>

        {/* Form dipusatkan; footer menempel ke dasar viewport */}
        <div className="relative m-auto w-full max-w-sm">
          {children}
        </div>

        <p className="relative mx-auto mt-auto w-full max-w-sm pt-10 text-center text-sm text-muted-foreground">
          {footer}
        </p>
      </section>
    </main>
  )
}
