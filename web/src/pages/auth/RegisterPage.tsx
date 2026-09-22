import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'

const MIN_PASSWORD_LENGTH = 8

const roleOptions = [
  { value: 'customer', label: 'Customer — I want to book stays' },
  { value: 'host', label: 'Host — I want to list a property' },
]

interface Values {
  name: string
  email: string
  password: string
  confirm: string
  role: string
}

function validate(values: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {}

  if (!values.name.trim()) errors.name = 'Enter your full name.'
  if (!values.email.trim()) errors.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.'

  if (!values.password) errors.password = 'Choose a password.'
  else if (values.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`

  if (!values.confirm) errors.confirm = 'Re-enter your password.'
  else if (values.confirm !== values.password) errors.confirm = 'Passwords do not match.'

  return errors
}

export function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'customer',
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

    // Mock registration — POST /auth/register and sign the user in when the API lands (issue #4)
    toast.success('Account created. Log in to get started.')
    navigate('/login')
  }

  return (
    <>
      <PageHeader
        title="Create an account"
        subtitle="Book a stay, or list your place — you can switch later."
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-card border border-ink-300 bg-surface p-6"
      >
        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Alex Rivera"
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

        <Select
          label="I am joining as"
          name="role"
          options={roleOptions}
          value={values.role}
          onChange={(event) => set('role')(event.target.value)}
        />

        <Button type="submit" size="lg" className="w-full">
          Create account
        </Button>

        <p className="text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>
      </form>
    </>
  )
}
