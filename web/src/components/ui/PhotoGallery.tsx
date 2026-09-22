import { useState } from 'react'
import type { Photo } from '@/lib/types'

/** Listing detail gallery: one large photo with thumbnails underneath. */
export function PhotoGallery({ photos, alt }: { photos: Photo[]; alt: string }) {
  const [active, setActive] = useState(0)
  if (!photos.length) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-card bg-ink-100 text-sm text-ink-500">
        No photos yet
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <img
        src={photos[active].url}
        alt={photos[active].caption || alt}
        className="aspect-[16/9] w-full rounded-card object-cover"
      />
      {photos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Photo ${index + 1}`}
                aria-current={index === active}
                className={`size-20 overflow-hidden rounded-control border-2 transition ${
                  index === active ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={photo.url} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
