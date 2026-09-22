export function RatingStars({
  rating,
  reviewCount,
  size = 'md',
}: {
  rating: number
  reviewCount?: number
  size?: 'sm' | 'md'
}) {
  const rounded = Math.round(rating * 2) / 2
  const text = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className={`inline-flex items-center gap-1 ${text}`}>
      <span aria-hidden className="text-brand-500">
        {'★'.repeat(Math.floor(rounded))}
        {rounded % 1 ? '½' : ''}
      </span>
      <span className="font-medium text-ink-900">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-ink-500">
          ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </span>
      )}
      <span className="sr-only">{rating} out of 5</span>
    </span>
  )
}
