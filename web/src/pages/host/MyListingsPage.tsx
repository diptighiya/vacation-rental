/** Host — My listings (issue #20). Lists the signed-in host's own rentals with
 *  edit / remove actions. Mock data until the host endpoints land. */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { StatTile } from '@/components/ui/StatTile'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { mockListings } from '@/lib/mockData'
import type { Listing } from '@/lib/types'

interface HostListing extends Listing {
  /** Confirmed bookings in the current calendar month. */
  bookings: number
}

/** Stand-in for GET /host/listings — the four mock rentals plus two of this host's own. */
const hostListings: HostListing[] = [
  { ...mockListings[0], bookings: 14 },
  { ...mockListings[1], bookings: 9 },
  { ...mockListings[2], hostId: 'h1', bookings: 0 },
  { ...mockListings[3], hostId: 'h1', bookings: 2 },
  {
    ...mockListings[1],
    id: 'l5',
    hostId: 'h1',
    title: 'Garden cottage in Willow Glen',
    description: 'Detached one-bedroom cottage with a fig tree out front and its own entrance.',
    address: {
      line1: '1425 Lincoln Ave',
      city: 'San Jose',
      state: 'CA',
      zip: '95125',
      lat: 37.3,
      lng: -121.91,
    },
    pricePerNight: 139,
    maxGuests: 3,
    status: 'approved',
    bookings: 11,
  },
  {
    ...mockListings[2],
    id: 'l6',
    hostId: 'h1',
    title: 'Wine-country casita in Healdsburg',
    description: 'Adobe casita on a working vineyard, ten minutes from the plaza.',
    address: {
      line1: '3300 Westside Rd',
      city: 'Healdsburg',
      state: 'CA',
      zip: '95448',
      lat: 38.58,
      lng: -122.9,
    },
    pricePerNight: 265,
    maxGuests: 4,
    status: 'pending',
    bookings: 0,
  },
]

export function MyListingsPage() {
  const toast = useToast()
  const [listings, setListings] = useState<HostListing[]>(hostListings)
  const [toRemove, setToRemove] = useState<HostListing | null>(null)

  const stats = useMemo(
    () => ({
      total: listings.length,
      approved: listings.filter((l) => l.status === 'approved').length,
      pending: listings.filter((l) => l.status === 'pending').length,
      bookings: listings.reduce((sum, l) => sum + l.bookings, 0),
    }),
    [listings],
  )

  const confirmRemove = () => {
    if (!toRemove) return
    setListings((current) =>
      current.map((l) => (l.id === toRemove.id ? { ...l, status: 'removed' as const } : l)),
    )
    toast.success(`"${toRemove.title}" removed from search results`)
    setToRemove(null)
  }

  const columns: Column<HostListing>[] = [
    {
      key: 'title',
      header: 'Listing',
      sortValue: (row) => row.title,
      render: (row) => (
        <div className="flex min-w-56 items-center gap-3">
          <img
            src={row.photos[0]?.url}
            alt=""
            loading="lazy"
            className="size-12 shrink-0 rounded-control bg-ink-100 object-cover"
          />
          <Link to={`/listings/${row.id}`} className="font-medium text-ink-900 hover:text-brand-600">
            {row.title}
          </Link>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      sortValue: (row) => row.address.city,
      render: (row) => (
        <span className="whitespace-nowrap">
          {row.address.city}, {row.address.state} {row.address.zip}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price / night',
      align: 'right',
      sortValue: (row) => row.pricePerNight,
      render: (row) => <span className="tabular-nums">${row.pricePerNight}</span>,
    },
    {
      key: 'guests',
      header: 'Max guests',
      align: 'right',
      sortValue: (row) => row.maxGuests,
      render: (row) => <span className="tabular-nums">{row.maxGuests}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'bookings',
      header: 'Bookings',
      align: 'right',
      sortValue: (row) => row.bookings,
      render: (row) => <span className="tabular-nums">{row.bookings}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-3 whitespace-nowrap">
          <Link
            to={`/host/listings/${row.id}/edit`}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setToRemove(row)}
            disabled={row.status === 'removed'}
            className="text-sm font-medium text-removed hover:underline disabled:cursor-not-allowed disabled:text-ink-500"
          >
            Remove
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="My listings"
        subtitle="Everything you host. New and edited listings go back to admin review before they appear in search."
        actions={
          <Link to="/host/listings/new">
            <Button>Add listing</Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total listings" value={stats.total} />
        <StatTile label="Approved" value={stats.approved} hint="Live in search" />
        <StatTile label="Pending review" value={stats.pending} hint="Waiting on an admin" />
        <StatTile label="Bookings this month" value={stats.bookings} />
      </div>

      <DataTable
        rows={listings}
        columns={columns}
        rowKey={(row) => row.id}
        empty="You haven't added a listing yet."
      />

      <ConfirmDialog
        open={!!toRemove}
        tone="danger"
        title="Remove this listing?"
        description={
          toRemove
            ? `"${toRemove.title}" will stop appearing in search. Existing bookings are not cancelled.`
            : undefined
        }
        confirmLabel="Remove listing"
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </>
  )
}
