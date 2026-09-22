/** Host — analytics dashboard (issue #31). Same tiles and chart as the admin
 *  dashboard, scoped to this host's own listings. Mock figures until /host/analytics lands. */
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/AppShell'
import { BarChartCard } from '@/components/ui/BarChartCard'
import type { BarDatum } from '@/components/ui/BarChartCard'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { PeriodToggle } from '@/components/ui/PeriodToggle'
import { StatTile } from '@/components/ui/StatTile'
import { mockAnalytics, mockListings } from '@/lib/mockData'
import type { AnalyticsPeriod } from '@/lib/types'

/** This host holds roughly a sixth of the marketplace, so the shared mock totals are scaled down. */
const HOST_SHARE = 0.16

const myListings = mockListings.slice(0, 4)

const deltas: Record<AnalyticsPeriod, { bookings: number; revenue: number; occupancy: number }> = {
  30: { bookings: 12.4, revenue: 9.8, occupancy: 4.1 },
  60: { bookings: 6.7, revenue: 5.2, occupancy: -1.8 },
  90: { bookings: -3.1, revenue: 2.4, occupancy: -0.6 },
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

interface ListingPerformance {
  id: string
  title: string
  bookings: number
  nights: number
  occupancy: number
  revenue: number
}

function performanceFor(period: AnalyticsPeriod): ListingPerformance[] {
  const months = period / 30
  return myListings.map((listing, index) => {
    const bookings = Math.max(1, Math.round((6 - index) * 1.6 * months))
    const nights = bookings * (3 + (index % 3))
    return {
      id: listing.id,
      title: listing.title,
      bookings,
      nights,
      occupancy: Math.min(98, Math.round((nights / period) * 100)),
      revenue: nights * listing.pricePerNight,
    }
  })
}

export function HostAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30)

  const rows = useMemo(() => performanceFor(period), [period])

  const totals = useMemo(() => {
    const months = period / 30
    const bookings = rows.reduce((sum, row) => sum + row.bookings, 0)
    const revenue = rows.reduce((sum, row) => sum + row.revenue, 0)
    const nights = rows.reduce((sum, row) => sum + row.nights, 0)
    return {
      bookings,
      revenue,
      cancellations: Math.round(mockAnalytics.totalCancellations * HOST_SHARE * months),
      occupancy: Math.round((nights / (period * myListings.length)) * 100),
    }
  }, [rows, period])

  const chartData = useMemo<BarDatum[]>(() => {
    const months = period / 30
    return mockAnalytics.byZip
      .slice(0, 5)
      .map((zip) => ({
        label: zip.zip,
        value: Math.max(1, Math.round(zip.bookings * HOST_SHARE * months)),
        note: money.format(Math.round(zip.revenue * HOST_SHARE * months)),
      }))
      .sort((a, b) => b.value - a.value)
  }, [period])

  const columns: Column<ListingPerformance>[] = [
    {
      key: 'title',
      header: 'Listing',
      sortValue: (row) => row.title,
      render: (row) => <span className="font-medium text-ink-900">{row.title}</span>,
    },
    {
      key: 'bookings',
      header: 'Bookings',
      align: 'right',
      sortValue: (row) => row.bookings,
      render: (row) => <span className="tabular-nums">{row.bookings}</span>,
    },
    {
      key: 'nights',
      header: 'Nights booked',
      align: 'right',
      sortValue: (row) => row.nights,
      render: (row) => <span className="tabular-nums">{row.nights}</span>,
    },
    {
      key: 'occupancy',
      header: 'Occupancy',
      align: 'right',
      sortValue: (row) => row.occupancy,
      render: (row) => <span className="tabular-nums">{row.occupancy}%</span>,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      sortValue: (row) => row.revenue,
      render: (row) => <span className="tabular-nums">{money.format(row.revenue)}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={`Your listings over the last ${period} days`}
        actions={<PeriodToggle value={period} onChange={setPeriod} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="My listings" value={myListings.length} hint="Approved and pending" />
        <StatTile label="Bookings" value={totals.bookings} delta={deltas[period].bookings} />
        <StatTile label="Cancellations" value={totals.cancellations} />
        <StatTile label="Revenue" value={money.format(totals.revenue)} delta={deltas[period].revenue} />
        <StatTile label="Occupancy" value={`${totals.occupancy}%`} delta={deltas[period].occupancy} />
      </div>

      <div className="grid gap-6">
        <BarChartCard
          title="Bookings by zip code"
          subtitle={`Where your guests stayed in the last ${period} days`}
          data={chartData}
          valueLabel="bookings"
        />

        <section className="grid gap-3">
          <h2 className="font-semibold text-ink-900">Performance by listing</h2>
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(row) => row.id}
            empty="No bookings in this period."
          />
        </section>
      </div>
    </>
  )
}
