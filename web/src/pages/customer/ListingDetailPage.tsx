import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DateRangeField, MAX_NIGHTS, nightsBetween } from '@/components/ui/DateRangeField'
import { EmptyState } from '@/components/ui/EmptyState'
import { GuestCounter } from '@/components/ui/GuestCounter'
import { MapView } from '@/components/ui/MapView'
import { PhotoGallery } from '@/components/ui/PhotoGallery'
import { RatingStars } from '@/components/ui/RatingStars'
import { useToast } from '@/components/ui/Toast'
import { mockListings, mockReviews } from '@/lib/mockData'

const CLEANING_FEE = 85

const reviewDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const listing = mockListings.find((item) => item.id === id) ?? mockListings[0]

  const [range, setRange] = useState({ checkIn: '', checkOut: '' })
  const [guests, setGuests] = useState(2)
  const [confirming, setConfirming] = useState(false)

  const nights = nightsBetween(range.checkIn, range.checkOut)
  const validStay = nights > 0 && nights <= MAX_NIGHTS
  const nightsTotal = listing.pricePerNight * nights
  const total = nightsTotal + CLEANING_FEE
  const reviews = mockReviews.filter((review) => review.listingId === listing.id)

  function confirmBooking() {
    // Mock booking — POST /bookings once the endpoint lands (issue #16)
    setConfirming(false)
    toast.success(`Booked ${listing.title} for ${nights} night${nights === 1 ? '' : 's'}`)
  }

  return (
    <>
      <PageHeader
        title={listing.title}
        subtitle={`${listing.address.line1}, ${listing.address.city}, ${listing.address.state} ${listing.address.zip}`}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-8">
          <PhotoGallery photos={listing.photos} alt={listing.title} />

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <RatingStars rating={listing.averageRating} reviewCount={listing.reviewCount} />
              <span className="text-sm text-ink-500">Up to {listing.maxGuests} guests</span>
            </div>
            <p className="text-ink-700">{listing.description}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink-900">What this place offers</h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {listing.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-2 text-sm text-ink-700">
                  <span aria-hidden className="text-brand-600">
                    ✓
                  </span>
                  {amenity}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-card border border-ink-300 bg-surface p-5">
            <h2 className="mb-2 text-lg font-semibold text-ink-900">Your host</h2>
            <p className="text-sm text-ink-700">Nina Alvarez · Hosting since 2021</p>
            <p className="mt-1 text-sm text-ink-500">
              Questions before you book? Message the host at{' '}
              <a
                href="mailto:nina.host@stayfinder.dev"
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                nina.host@stayfinder.dev
              </a>{' '}
              — typical reply within an hour.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink-900">Where you will be</h2>
            <MapView listings={[listing]} activeId={listing.id} height={320} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink-900">Reviews</h2>
            {reviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="Be the first to review this place after your stay."
              />
            ) : (
              <ul className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-card border border-ink-300 bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ink-900">{review.customerName}</p>
                      <span className="text-xs text-ink-500">
                        {reviewDate.format(new Date(review.createdAt))}
                      </span>
                    </div>
                    <RatingStars rating={review.rating} size="sm" />
                    <p className="mt-2 text-sm text-ink-700">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="flex flex-col gap-4 rounded-card border border-ink-300 bg-surface p-5 shadow-sm">
            <p className="text-ink-700">
              <span className="text-2xl font-semibold text-ink-900">${listing.pricePerNight}</span> / night
            </p>

            <DateRangeField checkIn={range.checkIn} checkOut={range.checkOut} onChange={setRange} />
            <GuestCounter value={guests} onChange={setGuests} max={listing.maxGuests} />

            <dl className="flex flex-col gap-2 border-t border-ink-300 pt-4 text-sm">
              <div className="flex justify-between text-ink-700">
                <dt>
                  ${listing.pricePerNight} × {nights} night{nights === 1 ? '' : 's'}
                </dt>
                <dd className="tabular-nums">${nightsTotal}</dd>
              </div>
              <div className="flex justify-between text-ink-700">
                <dt>Cleaning fee</dt>
                <dd className="tabular-nums">${CLEANING_FEE}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-300 pt-2 font-semibold text-ink-900">
                <dt>Total</dt>
                <dd className="tabular-nums">${validStay ? total : 0}</dd>
              </div>
            </dl>

            <Button size="lg" disabled={!validStay} onClick={() => setConfirming(true)}>
              Book
            </Button>
            {!validStay && <p className="text-xs text-ink-500">Choose your dates to see the total.</p>}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Confirm your booking"
        description={`${listing.title} · ${range.checkIn} → ${range.checkOut} · ${guests} guest${guests === 1 ? '' : 's'}`}
        confirmLabel={`Book for $${total}`}
        onConfirm={confirmBooking}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
