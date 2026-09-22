import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { DateRangeField, MAX_NIGHTS, nightsBetween } from '@/components/ui/DateRangeField'
import { EmptyState } from '@/components/ui/EmptyState'
import { GuestCounter } from '@/components/ui/GuestCounter'
import { ListingCard } from '@/components/ui/ListingCard'
import { MapView } from '@/components/ui/MapView'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { mockListings } from '@/lib/mockData'
import type { Listing } from '@/lib/types'

const PAGE_SIZE = 6

const sortOptions = [
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating-desc', label: 'Rating: best first' },
]

const approved = mockListings.filter((listing) => listing.status === 'approved')

/** Stand-in result set: the approved mock listings re-dressed as eight nearby rentals.
 *  Replace with GET /listings once search lands (issue #13). */
const results: Listing[] = [
  ...approved,
  {
    ...approved[0],
    id: 'l1-wg',
    title: 'Willow Glen bungalow with a fig tree',
    description: 'Two-bedroom bungalow on a quiet street, five minutes from Lincoln Ave cafes.',
    address: {
      line1: '1465 Curtner Ave',
      city: 'San Jose',
      state: 'CA',
      zip: '95125',
      lat: 37.29,
      lng: -121.91,
    },
    pricePerNight: 189,
    maxGuests: 4,
    averageRating: 4.7,
    reviewCount: 93,
    bookedToday: 2,
  },
  {
    ...approved[0],
    id: 'l1-jt',
    title: 'Quiet condo by Japantown',
    description: 'One-bedroom condo with covered parking and a shared rooftop.',
    address: { line1: '620 N 6th St', city: 'San Jose', state: 'CA', zip: '95112', lat: 37.35, lng: -121.89 },
    pricePerNight: 142,
    maxGuests: 3,
    amenities: ['Wifi', 'Kitchen', 'Free parking', 'Air conditioning'],
    averageRating: 4.4,
    reviewCount: 58,
    bookedToday: 0,
  },
  {
    ...approved[1],
    id: 'l2-pg',
    title: 'Pacific Grove cottage two blocks from the shore',
    description: 'Restored 1920s cottage with a wood stove and a fenced garden.',
    address: {
      line1: '311 Lighthouse Ave',
      city: 'Pacific Grove',
      state: 'CA',
      zip: '93950',
      lat: 36.62,
      lng: -121.92,
    },
    pricePerNight: 232,
    maxGuests: 4,
    amenities: ['Wifi', 'Kitchen', 'Fireplace', 'Beach access'],
    averageRating: 4.9,
    reviewCount: 61,
    bookedToday: 4,
  },
  {
    ...approved[1],
    id: 'l2-cbs',
    title: 'Carmel bungalow with a cedar deck',
    description: 'Walk to the beach path and the village. Sleeps four, dog friendly.',
    address: {
      line1: '26 Junipero St',
      city: 'Carmel-by-the-Sea',
      state: 'CA',
      zip: '93923',
      lat: 36.55,
      lng: -121.92,
    },
    pricePerNight: 305,
    maxGuests: 4,
    amenities: ['Wifi', 'Kitchen', 'Pets allowed', 'Free parking'],
    averageRating: 4.8,
    reviewCount: 47,
    bookedToday: 1,
  },
  {
    ...approved[0],
    id: 'l1-sc',
    title: 'Midtown house near the Santa Cruz wharf',
    description: 'Three-bedroom house with a big kitchen table and boards in the garage.',
    address: {
      line1: '412 Soquel Ave',
      city: 'Santa Cruz',
      state: 'CA',
      zip: '95060',
      lat: 36.97,
      lng: -122.02,
    },
    pricePerNight: 268,
    maxGuests: 6,
    amenities: ['Wifi', 'Kitchen', 'Washer', 'Beach access'],
    averageRating: 4.5,
    reviewCount: 112,
    bookedToday: 2,
  },
  {
    ...approved[1],
    id: 'l2-sb',
    title: 'Seabright studio with a surfboard rack',
    description: 'Ground-floor studio one block from Seabright Beach. Outdoor shower.',
    address: {
      line1: '88 Pilkington Ave',
      city: 'Santa Cruz',
      state: 'CA',
      zip: '95062',
      lat: 36.96,
      lng: -121.99,
    },
    pricePerNight: 154,
    maxGuests: 2,
    averageRating: 4.3,
    reviewCount: 36,
    bookedToday: 0,
  },
]

export function SearchPage() {
  const navigate = useNavigate()
  const [range, setRange] = useState({ checkIn: '', checkOut: '' })
  const [guests, setGuests] = useState(2)
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [sort, setSort] = useState('price-asc')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [page, setPage] = useState(1)

  const nights = nightsBetween(range.checkIn, range.checkOut)
  const stayTooLong = nights > MAX_NIGHTS

  const matches = useMemo(() => {
    const cityTerm = city.trim().toLowerCase()
    const zipTerm = zip.trim()

    const filtered = results.filter((listing) => {
      if (listing.maxGuests < guests) return false
      if (cityTerm && !listing.address.city.toLowerCase().includes(cityTerm)) return false
      if (zipTerm && !listing.address.zip.startsWith(zipTerm)) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'price-desc') return b.pricePerNight - a.pricePerNight
      if (sort === 'rating-desc') return b.averageRating - a.averageRating
      return a.pricePerNight - b.pricePerNight
    })
  }, [city, zip, guests, sort])

  const currentPage = Math.min(page, Math.max(1, Math.ceil(matches.length / PAGE_SIZE)))
  const visible = matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const resetPage = () => setPage(1)
  const clearFilters = () => {
    setRange({ checkIn: '', checkOut: '' })
    setGuests(1)
    setCity('')
    setZip('')
    resetPage()
  }

  return (
    <>
      <PageHeader
        title="Search rentals"
        subtitle="Pick your dates and party size to see nightly and total prices."
      />

      <section className="mb-6 rounded-card border border-ink-300 bg-surface p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[auto_auto_1fr_1fr_12rem]">
          <DateRangeField
            checkIn={range.checkIn}
            checkOut={range.checkOut}
            onChange={(next) => {
              setRange(next)
              resetPage()
            }}
          />
          <GuestCounter
            value={guests}
            onChange={(next) => {
              setGuests(next)
              resetPage()
            }}
          />
          <TextField
            label="City"
            placeholder="Santa Cruz"
            value={city}
            onChange={(event) => {
              setCity(event.target.value)
              resetPage()
            }}
          />
          <TextField
            label="Zip code"
            inputMode="numeric"
            placeholder="95060"
            value={zip}
            onChange={(event) => {
              setZip(event.target.value)
              resetPage()
            }}
          />
          <Select
            label="Sort by"
            options={sortOptions}
            value={sort}
            onChange={(event) => {
              setSort(event.target.value)
              resetPage()
            }}
          />
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          {matches.length} {matches.length === 1 ? 'rental' : 'rentals'}
          {nights > 0 && !stayTooLong && ` · ${nights} night${nights === 1 ? '' : 's'}`}
        </p>
        <div
          role="group"
          aria-label="Result view"
          className="inline-flex rounded-control border border-ink-300 bg-surface p-0.5"
        >
          {(['list', 'map'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={`rounded-[0.4rem] px-3 py-1.5 text-sm font-medium capitalize transition ${
                view === option ? 'bg-brand-600 text-white' : 'text-ink-700 hover:bg-ink-100'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          title="No rentals match those filters"
          description="Try a wider date range, fewer guests, or clear the city and zip code."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : view === 'map' ? (
        <MapView listings={matches} onSelect={(listing) => navigate(`/listings/${listing.id}`)} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                nights={nights > 0 && !stayTooLong ? nights : undefined}
                available={!stayTooLong}
                onBook={(booked) => navigate(`/listings/${booked.id}`)}
              />
            ))}
          </div>

          <div className="mt-6">
            <Pagination page={currentPage} pageSize={PAGE_SIZE} total={matches.length} onChange={setPage} />
          </div>
        </>
      )}
    </>
  )
}
