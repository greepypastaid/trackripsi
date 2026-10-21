import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/brand-logo'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? (err.errors.email?.[0] ?? err.message) : 'Gagal masuk.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      footer={
        <>
          Belum punya akun?{' '}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Daftar
          </Link>
        </>
      }
    >
      <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-500">
        <header className="space-y-3">
          <BrandLogo className="size-7" />
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">Masuk ke akunmu</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Lanjutkan progres skripsi dari titik terakhir,
            <br />
            kapan pun kamu butuh.
          </p>
        </header>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[0.8125rem] font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              className="h-10 rounded-lg text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[0.8125rem] font-semibold">
              Kata sandi
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="h-10 rounded-lg pr-10 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
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
            {busy ? 'Memeriksa akun…' : 'Masuk'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
