'use client'

import { useState } from 'react'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Box, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-1/4 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border/50 bg-card p-8 shadow-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Box className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight">Quixel</h1>
              <p className="mt-1 text-sm text-muted-foreground">Accedi al tuo gestionale</p>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="tua@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
