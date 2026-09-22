import { Link } from 'react-router-dom'
import type { Listing } from '@/lib/types'
import { Button } from './Button'
import { RatingStars } from './RatingStars'
import { StatusBadge } from './StatusBadge'

/** Search result card. `available` drives whether the Book button shows (requirement:
 *  "display clickable buttons to book, if available for the requested date(s)"). */
export function ListingCard({
  listing,
  nights,
  available = true,
  showStatus = false,
  onBook,
}: {
  listing: Listing
  nights?: number
  available?: boolean
  showStatus?: boolean
  onBook?: (listing: Listing) => void
}) {
  const total = nights ? listing.pricePerNight * nights : undefined

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-ink-300 bg-surface transition hover:shadow-md">
      <Link to={`/listings/${listing.id}`} className="block aspect-[3/2] overflow-hidden bg-ink-100">
        <img
          src={listing.photos[0]?.url}
          alt={listing.title}
          loading="lazy"
          className="size-full object-cover transition duration-300 hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/listings/${listing.id}`} className="font-medium text-ink-900 hover:text-brand-600">
            {listing.title}
          </Link>
          {showStatus && <StatusBadge status={listing.status} />}
        </div>

        <p className="text-sm text-ink-500">
          {listing.address.city}, {listing.address.state} {listing.address.zip} · up to {listing.maxGuests}{' '}
          guests
        </p>

        <RatingStars rating={listing.averageRating} reviewCount={listing.reviewCount} size="sm" />

        <ul className="flex flex-wrap gap-1.5">
          {listing.amenities.slice(0, 4).map((amenity) => (
            <li key={amenity} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
              {amenity}
            </li>
          ))}
          {listing.amenities.length > 4 && (
            <li className="px-1 py-0.5 text-xs text-ink-500">+{listing.amenities.length - 4} more</li>
          )}
        </ul>

        {listing.bookedToday > 0 && (
          <p className="text-xs font-medium text-brand-600">
            Booked {listing.bookedToday} time{listing.bookedToday === 1 ? '' : 's'} today
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          <p className="text-sm text-ink-700">
            <span className="text-base font-semibold text-ink-900">${listing.pricePerNight}</span> / night
            {total !== undefined && <span className="block text-xs text-ink-500">${total} total</span>}
          </p>
          {available ? (
            <Button size="sm" onClick={() => onBook?.(listing)}>
              Book
            </Button>
          ) : (
            <span className="text-xs text-ink-500">Not available</span>
          )}
        </div>
      </div>
    </article>
  )
}
