import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/brand-logo'
import { GoogleSignInButton } from '@/components/google-sign-in-button'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await register(form.name, form.email, form.password, form.confirm)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(Object.values(err.errors)[0]?.[0] ?? err.message)
      } else {
        setError('Gagal mendaftar.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-500">
        <header className="space-y-3">
          <BrandLogo className="size-7" />
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">Buat akun</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Akses tugas, catatan, dan proyek skripsimu kapan saja,
            <br />
            semuanya tetap di satu tempat.
          </p>
        </header>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-[0.8125rem] font-semibold">
              Nama lengkap
            </Label>
            <Input
              id="name"
              required
              maxLength={255}
              autoComplete="name"
              className="h-10 rounded-lg text-sm"
              value={form.name}
              onChange={set('name')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[0.8125rem] font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="h-10 rounded-lg text-sm"
              value={form.email}
              onChange={set('email')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[0.8125rem] font-semibold">
              Kata sandi (min. 8 karakter)
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                className="h-10 rounded-lg pr-10 text-sm"
                value={form.password}
                onChange={set('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm" className="text-[0.8125rem] font-semibold">
              Ulangi kata sandi
            </Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                className="h-10 rounded-lg pr-10 text-sm"
                value={form.confirm}
                onChange={set('confirm')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                aria-pressed={showConfirm}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="h-10 w-full rounded-lg text-sm font-semibold shadow-lg shadow-primary/25"
          >
            {busy ? 'Menyiapkan akun…' : 'Buat akun'}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          atau
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton />
      </div>
    </AuthLayout>
  )
}
