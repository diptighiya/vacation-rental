/** Map placeholder with positioned pins.
 *  Swap the inner div for @vis.gl/react-google-maps in issue #27 — the props stay the same. */
import type { Listing } from '@/lib/types'

export function MapView({
  listings,
  activeId,
  onSelect,
  height = 420,
}: {
  listings: Listing[]
  activeId?: string
  onSelect?: (listing: Listing) => void
  height?: number
}) {
  const lats = listings.map((l) => l.address.lat)
  const lngs = listings.map((l) => l.address.lng)
  const bounds = {
    minLat: Math.min(...lats) - 0.4,
    maxLat: Math.max(...lats) + 0.4,
    minLng: Math.min(...lngs) - 0.4,
    maxLng: Math.max(...lngs) + 0.4,
  }
  const position = (lat: number, lng: number) => ({
    left: `${((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * 100}%`,
    top: `${(1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * 100}%`,
  })

  return (
    <div
      className="relative overflow-hidden rounded-card border border-ink-300 bg-[repeating-linear-gradient(45deg,#eef1ee,#eef1ee_12px,#e7ebe7_12px,#e7ebe7_24px)]"
      style={{ height }}
      role="img"
      aria-label={`Map with ${listings.length} rentals`}
    >
      <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-3 py-1 text-xs text-ink-500">
        Google Maps goes here (issue #27)
      </span>

      {listings.map((listing) => (
        <button
          key={listing.id}
          type="button"
          onClick={() => onSelect?.(listing)}
          style={position(listing.address.lat, listing.address.lng)}
          className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold shadow transition ${
            activeId === listing.id
              ? 'z-10 scale-110 bg-ink-900 text-white'
              : 'bg-surface text-ink-900 hover:bg-brand-600 hover:text-white'
          }`}
        >
          ${listing.pricePerNight}
        </button>
      ))}
    </div>
  )
}
