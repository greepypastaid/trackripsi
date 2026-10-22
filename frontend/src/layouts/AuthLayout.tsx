import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'

const PANEL_BG =
  'radial-gradient(115% 85% at 88% 8%, rgba(199,140,250,0.95) 0%, rgba(120,80,240,0) 58%),' +
  'radial-gradient(85% 75% at 8% 0%, rgba(120,214,240,0.95) 0%, rgba(103,214,240,0) 55%),' +
  'radial-gradient(65% 55% at 55% 42%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 62%),' +
  'linear-gradient(160deg, #8580f6 0%, #4b3fd8 46%, #2b1e8f 100%)'

export function AuthLayout({
  children,
  footer,
}: {
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-[#f4f2fd] p-4 dark:bg-background sm:p-6">
      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="relative grid w-full max-w-[1000px] overflow-hidden rounded-[28px] border border-white bg-card shadow-[0_20px_60px_-24px_rgba(58,42,150,0.35)] dark:border-border lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden p-3 lg:block">
          <section
            className="relative flex h-full min-h-[540px] flex-col overflow-hidden rounded-[22px] p-8 text-white xl:p-10"
            style={{ backgroundImage: PANEL_BG }}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-xl bg-white p-1.5">
                <BrandLogo className="size-7" />
              </span>
              <span className="text-md font-bold   tracking-tight">Trackripsi</span>
            </div>

            <div className="mt-auto max-w-xs space-y-2">
              <p className="text-xs text-white/75">Dari proposal sampai sidang</p>
              <p className="text-2xl leading-snug font-semibold tracking-tight">
                Semua urusan skripsi, satu tempat aja
              </p>
            </div>
          </section>
        </div>

        <section className="flex flex-col px-6 py-10 sm:px-14 sm:py-14">
          <div className="flex items-center gap-2 lg:hidden">
          </div>

          <div className="m-auto w-full max-w-[340px] py-8">{children}</div>

          <p className="mt-auto pt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </section>
      </div>
    </main>
  )
}
