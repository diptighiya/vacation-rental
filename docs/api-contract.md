# StayFinder API contract

> **Status: draft for review (#1).** This needs sign-off from all three of us before it is
> final. Anything marked *(proposed)* isn't in an issue yet, but a screen needs it. Please
> comment on those in the review.

The web app and the Spring Boot API both build against this document. If an endpoint's shape
changes, update this file in the same PR.

- [Conventions](#conventions): base URL, auth, dates, money, pagination
- [Errors](#errors): the error shape and status codes
- [Shared shapes](#shared-shapes): User, Listing, Booking, Review, Analytics
- Endpoints: [Auth](#auth) · [Customer](#customer) · [Host](#host) · [Admin](#admin)

---

## Conventions

| Topic | Rule |
|---|---|
| Base URL | Every path starts with `/api`. Local: `http://localhost:8080/api`. |
| Format | JSON in and out (`Content-Type: application/json`). The only exception is photo upload, which is `multipart/form-data`. |
| Field names | `camelCase` in JSON. The database uses `snake_case`. |
| IDs | UUID strings, e.g. `"8d3f5c2e-1b7a-4f0e-9c1d-2a6b7e9f0a11"`. Examples below shorten them. |
| Auth | `Authorization: Bearer <jwt>` on every endpoint not marked **Public**. |
| Roles | `customer`, `host` and `admin`. Each endpoint lists the role it needs. The wrong role gets `403`. |
| Instants | ISO 8601 in **UTC** with a `Z`, e.g. `"2026-10-02T22:00:00Z"`. Clients convert to local time for display. |
| Calendar dates | `"YYYY-MM-DD"`, e.g. `"2026-10-02"`. Used for stay dates and availability. |
| Times of day | `"HH:mm"` (24h), e.g. `"15:00"`. House hours are in the listing's local `timeZone`. |
| Money | JSON numbers in USD, up to 2 decimals: `139` or `139.5`. Never strings. |
| Enums | Lowercase strings: `"pending"`, `"approved"`, `"removed"`, `"confirmed"`, `"cancelled"`. |
| Empty results | `200` with an empty list, never `404`. |

### Pagination

List endpoints marked *paginated* take `page` (1-based, default `1`) and `pageSize` (default
`20`, max `50`), and return:

```json
{
  "items": [],
  "page": 2,
  "pageSize": 20,
  "totalItems": 134,
  "totalPages": 7
}
```

`page` past the end returns an empty `items` list. `pageSize` over 50 is a `400`.

### Sorting

Where supported: `sort=<field>` and `order=asc|desc`. The allowed fields are listed per endpoint.

---

## Errors

Every error response has this body, whatever the status code:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields need fixing.",
    "fields": {
      "zip": "Enter a 5-digit ZIP code",
      "pricePerNight": "Enter a nightly price above $0"
    }
  }
}
```

- `code`: a stable, machine-readable value from the table below. The UI branches on it.
- `message`: one sentence that is safe to show to the user.
- `fields`: only on `VALIDATION_ERROR`. Maps each field (dot paths for nested ones, e.g.
  `address.zip`) to a message the form shows inline.
- No stack traces, SQL or class names ever appear in a response (#37–#39).

The web `apiClient` turns this into `ApiError { code, message, fields }`.

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | The body or query failed validation. `fields` says which ones. |
| 401 | `UNAUTHENTICATED` | No token, a malformed token or a bad signature. |
| 401 | `TOKEN_EXPIRED` | The token was valid but has expired. The UI sends the user to log in again. |
| 401 | `INVALID_CREDENTIALS` | Login with the wrong email or password. The message doesn't say which one. |
| 403 | `FORBIDDEN` | Signed in but the wrong role, or not the owner of the resource. |
| 404 | `NOT_FOUND` | Unknown ID, or a resource this caller may not see, e.g. a pending listing on the public detail endpoint. |
| 409 | `EMAIL_TAKEN` | Register with an email that already has an account. |
| 409 | `DATES_UNAVAILABLE` | A booking overlaps a confirmed stay, including a race lost at insert time (see the DB exclusion constraint). |
| 409 | `NOT_CANCELLABLE` | Cancelling a booking that has already started or is already cancelled. |
| 409 | `INVALID_STATE` | A moderation action that doesn't fit the listing's status, e.g. approving an approved listing. |
| 413 | `PAYLOAD_TOO_LARGE` | The upload request is bigger than the server limit (60 MB). |
| 500 | `INTERNAL_ERROR` | Anything unexpected. The message is always generic. |

Status code conventions for success:

| Status | When |
|---|---|
| 200 | Reads, updates and actions (`PATCH …/approve`) return the updated resource. |
| 201 | A resource was created. The body is the new resource, with a `Location` header. |
| 204 | A delete with nothing to return (photo delete). |

---

## Shared shapes

### User

```json
{
  "id": "u-7c1e",
  "role": "host",
  "name": "Nina Patel",
  "email": "nina.host@stayfinder.dev",
  "phone": "(408) 555-0142",
  "createdAt": "2026-03-01T17:20:00Z"
}
```

`passwordHash` is never returned.

### Listing

This is the shape `ListingCard`, `PhotoGallery` and the host table render.

```json
{
  "id": "l-5a2b",
  "hostId": "u-7c1e",
  "title": "Cozy garden cottage in Willow Glen",
  "description": "Detached one-bedroom cottage with its own entrance and a small private garden.",
  "address": {
    "line1": "1425 Lincoln Ave",
    "city": "San Jose",
    "state": "CA",
    "zip": "95125",
    "lat": 37.296104,
    "lng": -121.889412
  },
  "pricePerNight": 139,
  "maxGuests": 3,
  "checkInTime": "15:00",
  "checkOutTime": "11:00",
  "timeZone": "America/Los_Angeles",
  "status": "approved",
  "photos": [
    { "id": "p-01", "url": "https://…/cover.jpg", "caption": "Front of the house" },
    { "id": "p-02", "url": "https://…/living.jpg", "caption": "Living room" }
  ],
  "amenities": ["Wifi", "Kitchen", "Free parking"],
  "averageRating": 4.6,
  "reviewCount": 12,
  "bookedToday": 2
}
```

- `photos` come in display order. The first one is the cover.
- `lat` and `lng` are `null` until the address is geocoded.
- `averageRating` is `0` and `reviewCount` is `0` when there are no reviews yet.
- `bookedToday` counts confirmed bookings created today (UTC). It is computed on the server (#15).
- The public endpoints only return the street `line1` after a confirmed booking. Everyone
  else gets `"line1": null` along with the city, state and zip.

**ListingDetail** (`GET /api/listings/:id`) adds:

```json
{
  "contact": { "name": "Nina Patel", "phone": "(408) 555-0142", "email": "nina.host@stayfinder.dev" },
  "availability": [{ "id": "a-1", "startDate": "2026-09-01", "endDate": "2027-03-20" }]
}
```

**HostListing** (host endpoints) adds:

```json
{
  "statusReason": null,
  "submittedAt": "2026-09-14T18:02:11Z",
  "bookingsThisMonth": 11,
  "availability": [{ "id": "a-1", "startDate": "2026-09-01", "endDate": "2027-03-20" }],
  "contactPhone": "(408) 555-0142",
  "contactEmail": "nina.host@stayfinder.dev"
}
```

### Booking

```json
{
  "id": "b-91f0",
  "listing": {
    "id": "l-5a2b",
    "title": "Cozy garden cottage in Willow Glen",
    "city": "San Jose",
    "state": "CA",
    "coverPhotoUrl": "https://…/cover.jpg"
  },
  "customerId": "u-3d2a",
  "checkIn": "2026-10-02T22:00:00Z",
  "checkOut": "2026-10-05T18:00:00Z",
  "nights": 3,
  "guests": 2,
  "totalCost": 417,
  "status": "confirmed",
  "cancelledAt": null,
  "createdAt": "2026-09-22T19:44:03Z",
  "listingRemoved": false
}
```

`checkIn` and `checkOut` are the stay dates at the listing's house hours, converted to UTC.
`listingRemoved` is `true` when the host or an admin later removed the listing (#23).

### Review

```json
{
  "id": "r-11",
  "rating": 5,
  "comment": "Spotless, quiet and exactly like the photos.",
  "authorName": "Ava N.",
  "createdAt": "2026-09-08T16:30:00Z"
}
```

Only the reviewer's first name and last initial are shown.

### AnalyticsSummary

Admin and host dashboards use the same shape (#29). The host version only covers that host's
listings and adds `byListing`.

```json
{
  "period": 30,
  "from": "2026-08-23T00:00:00Z",
  "to": "2026-09-22T00:00:00Z",
  "totalListings": 41,
  "totalBookings": 212,
  "totalRevenue": 184230,
  "totalCancellations": 19,
  "occupancy": 63,
  "change": { "bookings": 12.4, "revenue": 9.8, "occupancy": 4.1 },
  "byZip": [
    { "zip": "95125", "city": "San Jose", "listings": 3, "bookings": 18, "revenue": 12450 }
  ],
  "byListing": [
    { "listingId": "l-5a2b", "title": "Cozy garden cottage in Willow Glen", "bookings": 9, "nights": 27, "occupancy": 90, "revenue": 3753 }
  ]
}
```

- **Window:** the last `period` days up to now.
- **Bookings:** confirmed bookings *created* in the window.
- **Revenue:** the sum of their `totalCost`.
- **Cancellations:** bookings *cancelled* in the window.
- **`totalListings`:** approved listings.
- **`occupancy`:** booked nights ÷ available nights, as a percentage from 0 to 100.
- **`change`:** the percentage change against the previous window of the same length. The
  `StatTile` delta shows it.
- **`byZip`:** sorted by `bookings`, highest first.
- **`byListing`:** host endpoint only.

---

## Auth

### `POST /api/auth/register`: Public (#4, #6, #7)

Creates a customer or host account and signs them in.

```json
{
  "name": "Nina Patel",
  "email": "Nina.Host@StayFinder.dev",
  "password": "correct-horse-9",
  "role": "host",
  "phone": "(408) 555-0142"
}
```

Validation:

| Field | Rule |
|---|---|
| `name` | Required, 1–120 characters |
| `email` | Required, a valid address, 254 characters max. It is stored lowercase. |
| `password` | Required, 8–72 characters |
| `role` | `"customer"` or `"host"`. `"admin"` gets `403 FORBIDDEN`: admins are only created by the seed (#7). |
| `phone` | Required when `role` is `"host"`, optional otherwise. A US number: 10 digits after stripping spaces, dashes, dots and brackets, with an optional leading `1` or `+1`. |

`201 Created`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9…",
  "expiresAt": "2026-09-23T19:44:03Z",
  "user": { "id": "u-7c1e", "role": "host", "name": "Nina Patel", "email": "nina.host@stayfinder.dev", "phone": "(408) 555-0142", "createdAt": "2026-09-22T19:44:03Z" }
}
```

Errors: `400 VALIDATION_ERROR`, `403 FORBIDDEN` (role admin), `409 EMAIL_TAKEN`.

### `POST /api/auth/login`: Public (#5)

```json
{ "email": "nina.host@stayfinder.dev", "password": "correct-horse-9" }
```

`200 OK`: the same body as register (`token`, `expiresAt`, `user`).

Errors: `400 VALIDATION_ERROR` (missing fields), `401 INVALID_CREDENTIALS`.

The JWT is HS256 and carries `sub` (the user ID), `role` and `exp`, and lasts 24 hours. The
UI sends each role to its home page (`homePath` in `web/src/lib/auth.tsx`). Hosts land on My
listings (`/host/listings`, #6) and admins on the approval queue (#7).

### `GET /api/auth/me`: Any signed-in role (#5)

`200 OK`: a **User**. Returns `401 UNAUTHENTICATED` or `401 TOKEN_EXPIRED` when the token is bad.

Logout is client-side: the UI drops the token. There is no server call.

---

## Customer

### `GET /api/listings/search`: Public (#13, #14, #15, #28), *paginated*

| Param | Required | Rule |
|---|---|---|
| `checkIn` | yes | A date, today or later |
| `nights` *or* `checkOut` | yes, exactly one | `nights` from 1 to 14, or `checkOut` a date after `checkIn`. More than 14 nights gets `400`. |
| `guests` | yes | An integer from 1 to 16 |
| `checkInTime` | no | `HH:mm`. Only returns listings whose check-in opens at or before this time. |
| `city`, `state` | no | Case-insensitive exact match. `state` is 2 letters. |
| `zip` | no | 5 digits, otherwise `400` |
| `lat`, `lng`, `radiusKm` | no, but all three together | `radiusKm` from 1 to 100. Adds `distanceKm` to each result. |
| `sort` | no | `price`, `rating` or `distance` (only with `lat`/`lng`). The default is `rating`, highest first. |
| `order` | no | `asc` or `desc` |

The search returns only **approved** listings where `maxGuests >= guests`, the stay fits inside
one availability window, and no confirmed booking overlaps. Each item is a **Listing** plus:

```json
{ "available": true, "nights": 3, "totalCost": 417, "distanceKm": 2.4 }
```

Errors: `400 VALIDATION_ERROR` with `fields`, e.g. `{ "nights": "Stays can be at most 14 nights" }`
or `{ "checkIn": "Pick a date from today on" }`.

### `GET /api/listings/:id`: Public (#16)

`200 OK`: a **ListingDetail**. Returns `404 NOT_FOUND` if the ID is unknown or the listing isn't approved.

### `GET /api/listings/:id/reviews`: Public (#16), *paginated*

The newest reviews come first. `200 OK`: the page envelope with **Review** items, plus
`averageRating` and `reviewCount`.

### `GET /api/amenities`: Public *(proposed)*

Returns the predefined amenity list for the search filters and the host form:
`200 OK` `{ "items": ["Wifi", "Kitchen", "Free parking"] }`.

### `POST /api/bookings`: Customer (#17)

```json
{ "listingId": "l-5a2b", "checkIn": "2026-10-02", "checkOut": "2026-10-05", "guests": 2 }
```

The server re-checks everything in one transaction:

- the listing is approved
- `guests` ≤ `maxGuests`
- the stay is 1–14 nights and starts today or later
- the stay fits inside an availability window
- no confirmed booking overlaps it

The server works out `totalCost` as nights × `pricePerNight`. Any cost the client sends is ignored.

`201 Created`: a **Booking**.

Errors: `400 VALIDATION_ERROR`, `404 NOT_FOUND`, `409 DATES_UNAVAILABLE`.

### `GET /api/bookings/me`: Customer (#18)

`200 OK`:

```json
{ "upcoming": [ /* Booking, soonest first */ ], "past": [ /* Booking, most recent first */ ] }
```

A booking is *upcoming* while `checkIn` is in the future. Cancelled bookings go in whichever
list their dates fall in.

### `PATCH /api/bookings/:id/cancel`: Customer (#18)

There is no body. `200 OK`: the **Booking** with `status: "cancelled"`. Its dates show up in
search again.

Errors: `403 FORBIDDEN` (not your booking), `404 NOT_FOUND`, `409 NOT_CANCELLABLE`.

---

## Host

Every host endpoint only works on the caller's own listings. Someone else's listing returns
`403 FORBIDDEN`, and a customer or admin token returns `403 FORBIDDEN` on every
`/api/host/*` route (#6).

### Listing fields and validation

`POST` and `PUT` take the same body. `web/src/pages/host/ListingFormPage.tsx` checks the same
rules on the client.

```json
{
  "title": "Cozy garden cottage in Willow Glen",
  "description": "Detached one-bedroom cottage with its own entrance and a small private garden.",
  "address": { "line1": "1425 Lincoln Ave", "city": "San Jose", "state": "CA", "zip": "95125" },
  "pricePerNight": 139,
  "maxGuests": 3,
  "checkInTime": "15:00",
  "checkOutTime": "11:00",
  "contactPhone": "(408) 555-0142",
  "contactEmail": "nina.host@stayfinder.dev"
}
```

| Field | Rule | Message |
|---|---|---|
| `title` | 8–120 characters | "Give the listing a title of at least 8 characters" |
| `description` | 30–5000 characters | "Write at least 30 characters so guests know what to expect" |
| `pricePerNight` | > 0 and ≤ 10000 | "Enter a nightly price above $0" / "Nightly price must be $10,000 or less" |
| `maxGuests` | An integer from 1 to 16 | "Max guests must be between 1 and 16" |
| `address.line1` | Required, 200 characters max | "Street address is required" |
| `address.city` | Required, 100 characters max | "City is required" |
| `address.state` | A 2-letter US state code | "Pick a state" |
| `address.zip` | 5 digits | "Enter a 5-digit ZIP code" |
| `checkInTime`, `checkOutTime` | `HH:mm`. Optional, defaulting to `15:00` and `11:00`. | "Use a time like 15:00" |
| `contactPhone`, `contactEmail` | Optional. If missing, the host's own details are used. | |

The server geocodes the address to `lat`/`lng`. If that fails, the listing is still saved
with `null` coordinates, and admins see it flagged. `timeZone` comes from the address.

### `GET /api/host/listings`: Host (#20)

`200 OK` `{ "items": [ /* HostListing */ ] }`, newest first, in every status. Hosts have few
listings, so this isn't paginated.

### `POST /api/host/listings`: Host (#19)

`201 Created`: a **HostListing** with `status: "pending"`. It doesn't appear in search until
an admin approves it. Photos, amenities and availability are set with the calls below once
the listing exists.

### `GET /api/host/listings/:id`: Host *(proposed, needed to fill the edit form)*

`200 OK`: a **HostListing**.

### `PUT /api/host/listings/:id`: Host (#21)

Replaces the listing fields. Any edit to an approved listing sends it back to `pending` for
admin review, and re-geocodes it if the address changed. Editing a listing an admin rejected
resubmits it. `200 OK`: a **HostListing**.

### `PUT /api/host/listings/:id/availability`: Host (#21)

Replaces all availability windows.

```json
{ "windows": [ { "startDate": "2026-10-01", "endDate": "2026-12-20" }, { "startDate": "2027-01-05", "endDate": "2027-03-31" } ] }
```

Each window needs `endDate > startDate`, and `startDate` must be today or later, unless the
window is unchanged. Windows may not overlap each other. Existing confirmed bookings keep
their dates. `200 OK` `{ "windows": [ { "id": "a-1", "startDate": "…", "endDate": "…" } ] }`

### `PUT /api/host/listings/:id/amenities`: Host (#22)

```json
{ "amenities": ["Wifi", "Kitchen", "Hot tub"] }
```

Each name must be from `GET /api/amenities`. An unknown one gets `400`, with
`fields.amenities` naming it. `200 OK` `{ "amenities": [...] }`

### `POST /api/host/listings/:id/photos`: Host (#22)

`multipart/form-data` with one or more `files` parts:

- JPEG or PNG, up to 5 MB each
- up to 10 photos per listing in total

The server stores each photo in S3 and appends it after the existing ones.

`201 Created` `{ "photos": [ /* every Photo on the listing, in order */ ] }`

Errors: `400 VALIDATION_ERROR` (`fields.files`: "Only JPG or PNG", "Each photo must be 5 MB
or smaller", "A listing can have up to 10 photos").

### `PUT /api/host/listings/:id/photos/order`: Host *(proposed, for #22 reorder and cover)*

```json
{ "photoIds": ["p-03", "p-01", "p-02"] }
```

This must list every photo on the listing, exactly once. The first one becomes the cover.
`200 OK` `{ "photos": [...] }`

### `DELETE /api/host/listings/:id/photos/:photoId`: Host (#22)

`204 No Content`. If you delete the cover, the next photo becomes the cover.

### `DELETE /api/host/listings/:id`: Host (#23)

This is a soft delete. The status becomes `removed` with the reason "Removed by the host.",
and the listing leaves search. Confirmed future bookings stay in place and get flagged
(`listingRemoved: true`), so the guests can be contacted.

`200 OK`:

```json
{ "id": "l-5a2b", "status": "removed", "flaggedBookings": 2 }
```

### `GET /api/host/analytics?period=30|60|90`: Host (#29, #31)

`200 OK`: an **AnalyticsSummary** covering only the caller's listings, with `byListing`.
Any `period` other than 30, 60 or 90 gets `400`.

---

## Admin

Every `/api/admin/*` route needs the `admin` role. Any other role gets `403 FORBIDDEN` (#7).

### `GET /api/admin/listings`: Admin (#24, #25), *paginated*

| Param | Rule |
|---|---|
| `status` | Optional: `pending`, `approved` or `removed` |
| `city`, `zip` | Optional filters, validated the same way as search |
| `sort` | `submittedAt` (the default, oldest first, so the queue is first-in first-out) or `title` |

Each item is a **HostListing** plus `host` (`{ id, name, email, phone }`) and `issues`,
which lists the automatic completeness flags (#25):

```json
{ "issues": ["NO_PHOTOS", "NOT_GEOCODED", "SHORT_DESCRIPTION", "NO_AVAILABILITY"] }
```

### `PATCH /api/admin/listings/:id/approve`: Admin (#24)

There is no body. The listing moves from `pending` to `approved`, and `reviewedAt` and
`reviewedBy` are set. `200 OK`: the listing.

Errors: `404 NOT_FOUND`, `409 INVALID_STATE` (the listing isn't pending).

### `PATCH /api/admin/listings/:id/reject`: Admin (#24)

```json
{ "reason": "Please add photos of the bedrooms." }
```

`reason` is required and at most 500 characters. The listing moves from `pending` to
`removed`, with `statusReason` set to the reason, which the host sees on My listings. If the
host edits the listing, it goes back to `pending`. `200 OK`: the listing.

### `PATCH /api/admin/listings/:id/remove`: Admin (#25)

```json
{ "reason": "Photos don't match the address on file." }
```

`reason` is required. An `approved` or `pending` listing becomes `removed` and leaves search,
and its future bookings are flagged the same way as a host removal. `200 OK`: the listing.

### `GET /api/admin/analytics?period=30|60|90`: Admin (#29, #30)

`200 OK`: an **AnalyticsSummary** across all listings. It has no `byListing`. Instead it has
`topListings`, the 10 listings with the most bookings in the window, in the same row shape.
Any other `period` gets `400`.

---

## Changelog

| Date | Change | By |
|---|---|---|
| 2026-09-22 | First draft covering every endpoint in the Sprint 1–3 issues | Juilee |
