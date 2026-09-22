import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { mockBookings, mockListings } from '@/lib/mockData'
import type { Booking } from '@/lib/types'

/** A couple of extra trips so both sections have rows before /bookings lands (issue #18). */
const extraBookings: Booking[] = [
  {
    id: 'b3',
    listingId: 'l2',
    listing: mockListings[1],
    customerId: 'c1',
    checkIn: '2026-11-20T15:00:00Z',
    checkOut: '2026-11-23T11:00:00Z',
    guests: 2,
    totalCost: 589,
    status: 'confirmed',
  },
  {
    id: 'b4',
    listingId: 'l1',
    listing: mockListings[0],
    customerId: 'c1',
    checkIn: '2026-07-04T15:00:00Z',
    checkOut: '2026-07-08T11:00:00Z',
    guests: 5,
    totalCost: 941,
    status: 'confirmed',
  },
]

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const formatStay = (checkIn: string, checkOut: string) =>
  `${dayFormat.format(new Date(checkIn))} – ${dayFormat.format(new Date(checkOut))}`

function BookingRow({ booking, onCancel }: { booking: Booking; onCancel?: (booking: Booking) => void }) {
  const photo = booking.listing?.photos[0]

  return (
    <li className="flex flex-col gap-4 rounded-card border border-ink-300 bg-surface p-4 sm:flex-row sm:items-center">
      <img
        src={photo?.url}
        alt=""
        loading="lazy"
        className="h-32 w-full rounded-control object-cover sm:h-20 sm:w-28"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link to={`/listings/${booking.listingId}`} className="font-medium text-ink-900 hover:text-brand-600">
          {booking.listing?.title ?? 'Rental'}
        </Link>
        <p className="text-sm text-ink-500">
          {formatStay(booking.checkIn, booking.checkOut)} · {booking.guests} guest
          {booking.guests === 1 ? '' : 's'}
        </p>
        <p className="text-sm text-ink-700">
          <span className="font-semibold text-ink-900">${booking.totalCost}</span> total
        </p>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <StatusBadge status={booking.status} />
        {onCancel && booking.status === 'confirmed' && (
          <Button variant="secondary" size="sm" onClick={() => onCancel(booking)}>
            Cancel
          </Button>
        )}
      </div>
    </li>
  )
}

export function MyBookingsPage() {
  const toast = useToast()
  const [bookings, setBookings] = useState<Booking[]>([...mockBookings, ...extraBookings])
  const [pendingCancel, setPendingCancel] = useState<Booking | null>(null)

  // Frozen once per visit so rows don't jump between sections while the page is open.
  const [now] = useState(() => Date.now())
  const upcoming = bookings.filter((booking) => new Date(booking.checkIn).getTime() >= now)
  const past = bookings.filter((booking) => new Date(booking.checkIn).getTime() < now)

  function cancelBooking() {
    if (!pendingCancel) return
    // Mock cancellation — PATCH /bookings/:id when the endpoint lands (issue #18)
    setBookings((current) =>
      current.map((booking) =>
        booking.id === pendingCancel.id ? { ...booking, status: 'cancelled' } : booking,
      ),
    )
    setPendingCancel(null)
    toast.success('Booking cancelled')
  }

  return (
    <>
      <PageHeader title="My bookings" subtitle="Your upcoming trips and everything you have stayed in." />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming trips"
            description="Once you book a stay it will show up here."
            action={
              <Link
                to="/search"
                className="inline-flex h-10 items-center rounded-control bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
              >
                Find a rental
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((booking) => (
              <BookingRow key={booking.id} booking={booking} onCancel={setPendingCancel} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Past</h2>
        {past.length === 0 ? (
          <EmptyState
            title="No past stays yet"
            description="Your trip history will appear here after checkout."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {past.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingCancel !== null}
        title="Cancel this booking?"
        description={
          pendingCancel
            ? `${pendingCancel.listing?.title ?? 'This rental'} · ${formatStay(pendingCancel.checkIn, pendingCancel.checkOut)}`
            : undefined
        }
        confirmLabel="Cancel booking"
        tone="danger"
        onConfirm={cancelBooking}
        onCancel={() => setPendingCancel(null)}
      />
    </>
  )
}
