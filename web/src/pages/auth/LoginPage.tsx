import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'
import { homePath } from '@/lib/auth'
import type { Role } from '@/lib/types'

const demoAccounts: { role: Role; email: string; blurb: string }[] = [
  { role: 'customer', email: 'sam.customer@stayfinder.dev', blurb: 'Search, book and manage trips' },
  { role: 'host', email: 'nina.host@stayfinder.dev', blurb: 'List properties and read analytics' },
  { role: 'admin', email: 'admin@stayfinder.dev', blurb: 'Approve listings and audit the platform' },
]

/** Any password works in the mock; the email decides the role. */
function roleForEmail(email: string): Role {
  const value = email.toLowerCase()
  if (value.includes('admin')) return 'admin'
  if (value.includes('host')) return 'host'
  return 'customer'
}

export function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password) {
      setError('Enter both your email and password to continue.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('That email address does not look right.')
      return
    }

    // Mock sign-in — replace with useAuth().login() when the API lands (issue #5)
    setError(null)
    const role = roleForEmail(email)
    toast.success(`Signed in as ${role}`)
    navigate(homePath[role])
  }

  return (
    <>
      <PageHeader title="Log in" subtitle="Welcome back to StayFinder." />

      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-card border border-ink-300 bg-surface p-6"
        >
          {error && <Alert tone="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" size="lg" className="w-full">
            Log in
          </Button>

          <p className="text-sm text-ink-500">
            New here?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </p>
        </form>

        <aside className="flex flex-col gap-3 rounded-card border border-ink-300 bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink-900">Demo accounts</h2>
          <p className="text-xs text-ink-500">Any password works while the API is mocked.</p>
          <ul className="flex flex-col gap-3">
            {demoAccounts.map((account) => (
              <li key={account.role} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword('demo1234')
                  }}
                  className="text-left text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  {account.email}
                </button>
                <span className="text-xs text-ink-500">{account.blurb}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  )
}
