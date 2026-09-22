/** Host — add / edit listing (issues #19, #21; photo handling #22).
 *  One form for both routes: /host/listings/new and /host/listings/:id/edit.
 *  Validation here mirrors the server rules in docs/api-contract.md; the server still re-checks. */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { DateRangeField } from '@/components/ui/DateRangeField'
import { GuestCounter } from '@/components/ui/GuestCounter'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'
import { mockListings, mockPhotoUrl } from '@/lib/mockData'
import type { Photo } from '@/lib/types'

const AMENITIES = [
  'Wifi',
  'Kitchen',
  'Free parking',
  'Washer',
  'Dryer',
  'Hot tub',
  'Pool',
  'Fireplace',
  'Air conditioning',
  'Pets allowed',
  'Beach access',
  'Gym',
  'Elevator',
]

const STATES = ['CA', 'NV', 'OR', 'WA', 'AZ', 'CO', 'TX', 'NY'].map((code) => ({
  value: code,
  label: code,
}))

const TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => ({
  value: time,
  label: time,
}))

interface AvailabilityRow {
  id: string
  checkIn: string
  checkOut: string
}

function newId() {
  return `tmp-${Date.now()}-${Math.round(Math.random() * 1000)}`
}

/** Stands in for the uploader in issue #22 — no file leaves the browser yet. */
function mockPhoto(): Photo {
  const seed = `upload-${Math.round(Math.random() * 100000)}`
  return { id: seed, url: mockPhotoUrl(seed), caption: '' }
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-card border border-ink-300 bg-surface p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
      </header>
      {children}
    </section>
  )
}

export function ListingFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const existing = id ? mockListings.find((listing) => listing.id === id) : undefined

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [price, setPrice] = useState(existing ? String(existing.pricePerNight) : '')
  const [maxGuests, setMaxGuests] = useState(existing?.maxGuests ?? 2)
  const [line1, setLine1] = useState(existing?.address.line1 ?? '')
  const [city, setCity] = useState(existing?.address.city ?? '')
  const [state, setState] = useState(existing?.address.state ?? 'CA')
  const [zip, setZip] = useState(existing?.address.zip ?? '')
  const [amenities, setAmenities] = useState<string[]>(existing?.amenities ?? [])
  const [photos, setPhotos] = useState<Photo[]>(existing?.photos ?? [])
  const [availability, setAvailability] = useState<AvailabilityRow[]>([
    { id: newId(), checkIn: '', checkOut: '' },
  ])
  const [checkInTime, setCheckInTime] = useState('15:00')
  const [checkOutTime, setCheckOutTime] = useState('11:00')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragging, setDragging] = useState(false)

  const toggleAmenity = (amenity: string) =>
    setAmenities((current) =>
      current.includes(amenity) ? current.filter((a) => a !== amenity) : [...current, amenity],
    )

  const addPhotos = (count: number) =>
    setPhotos((current) => [...current, ...Array.from({ length: count }, mockPhoto)])

  const validate = () => {
    const next: Record<string, string> = {}
    if (title.trim().length < 8) next.title = 'Give the listing a title of at least 8 characters'
    if (description.trim().length < 30)
      next.description = 'Write at least 30 characters so guests know what to expect'
    const priceValue = Number(price)
    if (!price.trim() || !Number.isFinite(priceValue) || priceValue <= 0)
      next.price = 'Enter a nightly price above $0'
    else if (priceValue > 10000) next.price = 'Nightly price must be $10,000 or less'
    if (!line1.trim()) next.line1 = 'Street address is required'
    if (!city.trim()) next.city = 'City is required'
    if (!/^\d{5}$/.test(zip.trim())) next.zip = 'Enter a 5-digit ZIP code'
    if (!photos.length) next.photos = 'Add at least one photo'
    return next
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return
    // POST /host/listings or PUT /host/listings/:id once the API exists.
    toast.success('Listing saved — pending admin approval')
    navigate('/host/listings')
  }

  return (
    <>
      <PageHeader
        title={existing ? 'Edit listing' : 'Add listing'}
        subtitle={
          existing
            ? 'Changes go back to admin review before they show up in search.'
            : 'New listings are reviewed by an admin before guests can see them.'
        }
      />

      <form onSubmit={handleSubmit} className="grid max-w-3xl gap-6" noValidate>
        <Section title="Basics" description="What guests see first in search results.">
          <div className="grid gap-4">
            <TextField
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              placeholder="Sunlit craftsman near Santana Row"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-ink-700">
                Description
                <span className="ml-0.5 text-removed">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={!!errors.description}
                placeholder="Three-bedroom home with a garden patio, ten minutes from downtown."
                className={`rounded-control border bg-surface px-3 py-2 text-sm text-ink-900 outline-none
                  placeholder:text-ink-500/70 focus:ring-2
                  ${
                    errors.description
                      ? 'border-removed focus:ring-removed/30'
                      : 'border-ink-300 focus:border-brand-500 focus:ring-brand-500/25'
                  }`}
              />
              {errors.description ? (
                <p className="text-xs text-removed">{errors.description}</p>
              ) : (
                <p className="text-xs text-ink-500">{description.trim().length} characters</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Price per night (USD)"
                required
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={errors.price}
                placeholder="214"
              />
              <GuestCounter label="Max guests" value={maxGuests} onChange={setMaxGuests} max={16} />
            </div>
          </div>
        </Section>

        <Section
          title="Address"
          description="Only the city and ZIP are shown publicly until a booking is confirmed."
        >
          <div className="grid gap-4">
            <TextField
              label="Street address"
              required
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              error={errors.line1}
              placeholder="218 Bird Ave"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="City"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={errors.city}
                placeholder="San Jose"
              />
              <Select
                label="State"
                options={STATES}
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <TextField
                label="ZIP code"
                required
                inputMode="numeric"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                error={errors.zip}
                placeholder="95126"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Amenities"
          description="Guests filter on these, so only tick what you actually provide."
        >
          <ul className="flex flex-wrap gap-2">
            {AMENITIES.map((amenity) => {
              const checked = amenities.includes(amenity)
              return (
                <li key={amenity}>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      checked
                        ? 'border-brand-600 bg-brand-50 font-medium text-brand-700'
                        : 'border-ink-300 text-ink-700 hover:bg-ink-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(amenity)}
                      className="size-4 accent-brand-600"
                    />
                    {amenity}
                  </label>
                </li>
              )
            })}
          </ul>
        </Section>

        <Section title="Photos" description="The first photo is the cover image shown in search.">
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              addPhotos(Math.max(1, event.dataTransfer.files.length))
            }}
            className={`grid place-items-center gap-2 rounded-card border-2 border-dashed p-8 text-center transition ${
              dragging ? 'border-brand-600 bg-brand-50' : 'border-ink-300 bg-canvas'
            }`}
          >
            <p className="text-sm text-ink-700">Drag photos here</p>
            <p className="text-xs text-ink-500">JPG or PNG, up to 10 per listing</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => addPhotos(1)}>
              Choose a file
            </Button>
          </div>

          {errors.photos && <p className="mt-2 text-xs text-removed">{errors.photos}</p>}

          {photos.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <li key={photo.id} className="relative overflow-hidden rounded-control border border-ink-300">
                  <img src={photo.url} alt="" className="aspect-[3/2] w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPhotos((current) => current.filter((p) => p.id !== photo.id))}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute right-2 top-2 size-7 rounded-full bg-surface/90 text-sm text-ink-700 hover:bg-surface hover:text-removed"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Availability" description="Add the date ranges the place can be booked.">
          <div className="grid gap-4">
            {availability.map((row) => (
              <div key={row.id} className="flex flex-wrap items-end gap-3">
                <DateRangeField
                  checkIn={row.checkIn}
                  checkOut={row.checkOut}
                  onChange={(range) =>
                    setAvailability((current) =>
                      current.map((r) => (r.id === row.id ? { ...r, ...range } : r)),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => setAvailability((current) => current.filter((r) => r.id !== row.id))}
                  disabled={availability.length === 1}
                  className="h-10 text-sm font-medium text-removed hover:underline disabled:cursor-not-allowed disabled:text-ink-500"
                >
                  Remove
                </button>
              </div>
            ))}

            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setAvailability((current) => [...current, { id: newId(), checkIn: '', checkOut: '' }])
                }
              >
                Add another range
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Check-in time"
                options={TIMES}
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
              <Select
                label="Check-out time"
                options={TIMES}
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
          </div>
        </Section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/host/listings')}>
            Cancel
          </Button>
          <Button type="submit">{existing ? 'Save changes' : 'Create listing'}</Button>
        </div>
      </form>
    </>
  )
}
