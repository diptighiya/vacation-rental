/** Host — sign up (issue #6). Uses the shared register API with role "host" and collects the
 *  contact phone guests see once they book. Mocked until the auth endpoints land (#4, #5). */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'

const MIN_PASSWORD_LENGTH = 8

interface Values {
  name: string
  email: string
  phone: string
  password: string
  confirm: string
}

/** US numbers only for now: 10 digits once spaces, dashes, dots and brackets are stripped,
 *  optionally with a leading 1. Same rule as the server (docs/api-contract.md). */
function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

function validate(values: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {}

  if (!values.name.trim()) errors.name = 'Enter your full name.'
  if (!values.email.trim()) errors.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.'

  if (!values.phone.trim()) errors.phone = 'Add a phone number guests can reach you on.'
  else if (!isValidPhone(values.phone)) errors.phone = 'Enter a 10-digit US phone number.'

  if (!values.password) errors.password = 'Choose a password.'
  else if (values.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`

  if (!values.confirm) errors.confirm = 'Re-enter your password.'
  else if (values.confirm !== values.password) errors.confirm = 'Passwords do not match.'

  return errors
}

const steps = [
  'Create your host account.',
  'Add a listing with photos, amenities and the dates it is free.',
  'An admin reviews it, and once approved it shows up in search.',
]

export function HostRegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({})

  const set = (key: keyof Values) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    // Mock registration — POST /api/auth/register { role: 'host', name, email, phone, password }
    // and sign the host in with the returned token when the API lands (issues #4, #5).
    // A 409 EMAIL_TAKEN goes on the email field; other field errors come back in ApiError.fields.
    toast.success('Host account created. Log in to add your first listing.')
    navigate('/host/login')
  }

  return (
    <>
      <PageHeader
        title="Become a host"
        subtitle="List your place on StayFinder. Every new listing is reviewed by an admin before guests can book it."
      />

      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-card border border-ink-300 bg-surface p-6"
        >
          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Nina Patel"
            required
            value={values.name}
            error={errors.name}
            onChange={(event) => set('name')(event.target.value)}
          />

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={values.email}
            error={errors.email}
            onChange={(event) => set('email')(event.target.value)}
          />

          <TextField
            label="Contact phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(408) 555-0142"
            required
            hint="Guests see this once their booking is confirmed."
            value={values.phone}
            error={errors.phone}
            onChange={(event) => set('phone')(event.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            value={values.password}
            error={errors.password}
            onChange={(event) => set('password')(event.target.value)}
          />

          <TextField
            label="Confirm password"
            type="password"
            name="confirm"
            autoComplete="new-password"
            required
            value={values.confirm}
            error={errors.confirm}
            onChange={(event) => set('confirm')(event.target.value)}
          />

          <Button type="submit" size="lg" className="w-full">
            Create host account
          </Button>

          <div className="flex flex-col gap-1 text-sm text-ink-500">
            <p>
              Already hosting?{' '}
              <Link to="/host/login" className="font-medium text-brand-600 hover:text-brand-700">
                Log in
              </Link>
            </p>
            <p>
              Just looking for a place to stay?{' '}
              <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
                Create a guest account
              </Link>
            </p>
          </div>
        </form>

        <aside className="flex flex-col gap-3 rounded-card border border-ink-300 bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink-900">How hosting works</h2>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-ink-700">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  )
}
