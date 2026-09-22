/** Host — log in (issue #6). Same login API as everyone else; a host lands on My listings.
 *  Customer and admin accounts are turned away here, and the RoleGuard on /host/* plus the
 *  API's 403 keep a customer token out of host routes either way. Mocked until #5 lands. */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'
import type { Role } from '@/lib/types'

/** Seeded by `api` (issue #3) with the demo password. */
const DEMO_HOST = { email: 'nina.host@stayfinder.dev', password: 'demo1234' }

/** Same stand-in as LoginPage: while the API is mocked, the email decides the role. */
function mockRoleForEmail(email: string): Role {
  const value = email.toLowerCase()
  if (value.includes('admin')) return 'admin'
  if (value.includes('host')) return 'host'
  return 'customer'
}

export function HostLoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notHost, setNotHost] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotHost(false)

    if (!email.trim() || !password) {
      setError('Enter both your email and password to continue.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('That email address does not look right.')
      return
    }

    // Mock sign-in — replace with useAuth().login() when the API lands (issue #5), then check
    // user.role on the response. A 401 INVALID_CREDENTIALS shows its message in the Alert.
    const role = mockRoleForEmail(email)
    if (role !== 'host') {
      setError(null)
      setNotHost(true)
      return
    }

    setError(null)
    toast.success('Welcome back')
    navigate('/host/listings')
  }

  return (
    <>
      <PageHeader title="Host log in" subtitle="Manage your listings, availability and bookings." />

      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-card border border-ink-300 bg-surface p-6"
        >
          {error && <Alert tone="error">{error}</Alert>}
          {notHost && (
            <Alert tone="warning" title="That isn't a host account">
              Guests and admins sign in on the{' '}
              <Link to="/login" className="font-medium underline">
                main login page
              </Link>
              . To list a place,{' '}
              <Link to="/host/register" className="font-medium underline">
                create a host account
              </Link>
              .
            </Alert>
          )}

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
            New to hosting?{' '}
            <Link to="/host/register" className="font-medium text-brand-600 hover:text-brand-700">
              Become a host
            </Link>
          </p>
        </form>

        <aside className="flex flex-col gap-3 rounded-card border border-ink-300 bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink-900">Demo host</h2>
          <p className="text-xs text-ink-500">
            Seeded by the API with approved, pending and removed listings.
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_HOST.email)
              setPassword(DEMO_HOST.password)
            }}
            className="text-left text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {DEMO_HOST.email}
          </button>
        </aside>
      </div>
    </>
  )
}
