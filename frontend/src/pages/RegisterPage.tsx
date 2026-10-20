import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Buat akun baru</CardTitle>
          <CardDescription>Data riset Anda tersimpan privat per akun.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nama lengkap</Label>
              <Input id="name" required maxLength={255} value={form.name} onChange={set('name')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Kata sandi (min. 8 karakter)</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Ulangi kata sandi</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.confirm}
                onChange={set('confirm')}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Memproses…' : 'Buat akun'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
