package dev.stayfinder.api.seed;

import static dev.stayfinder.api.seed.SeedCatalog.ADJECTIVES;
import static dev.stayfinder.api.seed.SeedCatalog.ADMIN_REMOVAL_REASONS;
import static dev.stayfinder.api.seed.SeedCatalog.CUSTOMERS;
import static dev.stayfinder.api.seed.SeedCatalog.EXTRAS;
import static dev.stayfinder.api.seed.SeedCatalog.HOSTS;
import static dev.stayfinder.api.seed.SeedCatalog.HOST_REMOVAL_REASON;
import static dev.stayfinder.api.seed.SeedCatalog.PHOTO_CAPTIONS;
import static dev.stayfinder.api.seed.SeedCatalog.PLACES;
import static dev.stayfinder.api.seed.SeedCatalog.PROPERTY_TYPES;
import static dev.stayfinder.api.seed.SeedCatalog.REVIEW_COMMENTS;

import dev.stayfinder.api.domain.BookingStatus;
import dev.stayfinder.api.domain.ListingStatus;
import dev.stayfinder.api.domain.Role;
import dev.stayfinder.api.seed.SeedCatalog.Person;
import dev.stayfinder.api.seed.SeedCatalog.Place;
import dev.stayfinder.api.seed.SeedCatalog.PropertyType;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Loads realistic demo data (issue #3): 6 hosts, 24 customers, 1 admin and 52 listings across
 * 16 cities / 22 zip codes, with photos, amenities, availability, bookings spread over the last
 * 90 days (plus upcoming ones) and reviews.
 *
 * <p>Idempotent: every row gets a deterministic id and is inserted with
 * {@code ON CONFLICT DO NOTHING}, so running it again adds nothing and changes nothing.
 * Dates are relative to the day of the first run; set {@code SEED_RESET=true} to wipe and
 * re-seed so "last 30 days" lines up with today again.
 */
@Service
public class DatabaseSeeder {

    static final int LISTING_COUNT = 52;

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    /** Fixed so every run produces the same listings, stays and reviews. */
    private static final long RANDOM_SEED = 20260922L;

    /** Listing i belongs to host i % 6, so 18 and 36 give the demo host (Nina) one of each. */
    private static final Set<Integer> PENDING = Set.of(5, 13, 18, 29, 37, 45, 51);
    private static final Set<Integer> REMOVED = Set.of(7, 20, 36, 46);
    /** Pending listings with no photos yet, for the admin "incomplete" flag (issue #25). */
    private static final Set<Integer> NO_PHOTOS = Set.of(13, 37);
    /** Pending listing whose address hasn't been geocoded. */
    private static final int NOT_GEOCODED = 29;
    /** Removed by its host rather than by an admin (issue #23). */
    private static final int REMOVED_BY_HOST = 20;

    private final JdbcTemplate jdbc;
    private final SeedProperties properties;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder();

    public DatabaseSeeder(JdbcTemplate jdbc, SeedProperties properties) {
        this.jdbc = jdbc;
        this.properties = properties;
    }

    @Transactional
    public SeedReport seed() {
        if (properties.reset()) {
            log.warn("SEED_RESET is on: deleting all users, listings, bookings and reviews");
            jdbc.execute("truncate table reviews, bookings, availability, listing_amenities, listing_photos,"
                    + " listings, users cascade");
        }

        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        LocalDate today = LocalDate.ofInstant(now, ZoneOffset.UTC);
        Random random = new Random(RANDOM_SEED);
        int inserted = 0;

        UUID adminId = seedAdmin(now);
        String demoHash = passwords.encode(properties.demoPassword());
        List<UUID> hostIds = new ArrayList<>();
        for (Person host : HOSTS) {
            inserted += insertUser(Role.HOST, host, demoHash, now.minus(days(200 + random.nextInt(200))));
            hostIds.add(userId(host.email()));
        }
        List<UUID> customerIds = new ArrayList<>();
        for (Person customer : CUSTOMERS) {
            inserted += insertUser(Role.CUSTOMER, customer, demoHash, now.minus(days(100 + random.nextInt(200))));
            customerIds.add(userId(customer.email()));
        }

        Map<String, Integer> amenityIds = jdbc.query("select id, name from amenities", rs -> {
            Map<String, Integer> ids = new HashMap<>();
            while (rs.next()) {
                ids.put(rs.getString("name"), rs.getInt("id"));
            }
            return ids;
        });

        for (int index = 0; index < LISTING_COUNT; index++) {
            inserted += seedListing(index, now, today, adminId, hostIds, customerIds, amenityIds);
        }

        SeedReport report = SeedReport.read(jdbc, inserted);
        log.info("{}", report);
        return report;
    }

    private UUID seedAdmin(Instant now) {
        String email = properties.adminEmail().toLowerCase(Locale.ROOT);
        String password = properties.adminPassword();
        boolean generated = password == null || password.isBlank();
        if (generated) {
            byte[] bytes = new byte[12];
            new SecureRandom().nextBytes(bytes);
            password = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        }

        int created = insertUser(Role.ADMIN, new Person("StayFinder Admin", email, null),
                passwords.encode(password), now.minus(days(400)));
        if (created == 0) {
            log.info("Admin {} already exists; its password was left unchanged", email);
        } else if (generated) {
            log.warn("Created admin {} with generated password: {}  (set SEED_ADMIN_PASSWORD to choose one)",
                    email, password);
        } else {
            log.info("Created admin {} with the password from SEED_ADMIN_PASSWORD", email);
        }
        return userId(email);
    }

    private int seedListing(int index, Instant now, LocalDate today, UUID adminId, List<UUID> hostIds,
            List<UUID> customerIds, Map<String, Integer> amenityIds) {
        // One generator per listing, so each listing comes out the same regardless of the others.
        Random random = new Random(RANDOM_SEED * 31 + index);
        Place place = PLACES.get(index % PLACES.size());
        PropertyType type = PROPERTY_TYPES.get(random.nextInt(PROPERTY_TYPES.size()));
        ListingStatus status = PENDING.contains(index) ? ListingStatus.PENDING
                : REMOVED.contains(index) ? ListingStatus.REMOVED
                : ListingStatus.APPROVED;
        UUID listingId = seedId("listing", index);
        UUID hostId = hostIds.get(index % hostIds.size());
        Person host = HOSTS.get(index % HOSTS.size());
        ZoneId zone = ZoneId.of(place.timeZone());

        String title = pick(random, ADJECTIVES) + " " + type.name() + " in " + place.neighborhood();
        String description = type.blurb() + " " + place.pitch() + " " + pick(random, EXTRAS);
        String street = (100 + random.nextInt(3800)) + " " + pick(random, place.streets());
        Double lat = index == NOT_GEOCODED ? null : round6(place.lat() + (random.nextDouble() - 0.5) * 0.02);
        Double lng = index == NOT_GEOCODED ? null : round6(place.lng() + (random.nextDouble() - 0.5) * 0.02);
        BigDecimal price = BigDecimal.valueOf(type.minPrice() + random.nextInt(type.maxPrice() - type.minPrice() + 1));
        LocalTime checkInTime = LocalTime.of(random.nextInt(4) == 0 ? 16 : 15, 0);
        LocalTime checkOutTime = LocalTime.of(random.nextInt(4) == 0 ? 10 : 11, 0);

        // Approved long enough ago that every seeded stay happened after approval.
        Instant submittedAt = status == ListingStatus.PENDING
                ? now.minus(days(1 + random.nextInt(10))).minus(hours(random.nextInt(24)))
                : now.minus(days(160 + random.nextInt(60)));
        Instant reviewedAt = status == ListingStatus.PENDING ? null : submittedAt.plus(days(1 + random.nextInt(3)));
        UUID reviewedBy = status == ListingStatus.PENDING ? null : adminId;
        Instant removedAt = status == ListingStatus.REMOVED ? now.minus(days(5 + random.nextInt(25))) : null;
        String statusReason = null;
        if (status == ListingStatus.REMOVED) {
            statusReason = index == REMOVED_BY_HOST ? HOST_REMOVAL_REASON : pick(random, ADMIN_REMOVAL_REASONS);
            if (index != REMOVED_BY_HOST) {
                reviewedAt = removedAt;
            }
        }
        Instant updatedAt = removedAt != null ? removedAt : reviewedAt != null ? reviewedAt : submittedAt;

        int inserted = jdbc.update("""
                insert into listings (id, host_id, title, description, address_line1, city, state, zip, lat, lng,
                    price_per_night, max_guests, check_in_time, check_out_time, time_zone, contact_phone,
                    contact_email, status, status_reason, submitted_at, reviewed_at, reviewed_by, created_at,
                    updated_at)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict do nothing
                """,
                listingId, hostId, title, description, street, place.city(), place.state(), place.zip(), lat, lng,
                price, type.maxGuests(), checkInTime, checkOutTime, place.timeZone(), host.phone(), host.email(),
                status.value(), statusReason, ts(submittedAt), ts(reviewedAt), reviewedBy, ts(submittedAt),
                ts(updatedAt));

        // Photos: the first is the cover. A couple of pending listings have none yet.
        int photoCount = NO_PHOTOS.contains(index) ? 0
                : status == ListingStatus.PENDING ? 2 + random.nextInt(3)
                : 3 + random.nextInt(3);
        for (int position = 0; position < photoCount; position++) {
            inserted += jdbc.update("""
                    insert into listing_photos (id, listing_id, url, caption, position, created_at)
                    values (?, ?, ?, ?, ?, ?)
                    on conflict do nothing
                    """,
                    seedId("photo", index + "/" + position), listingId,
                    "https://picsum.photos/seed/stayfinder-" + index + "-" + position + "/1200/800",
                    PHOTO_CAPTIONS.get(position), position, ts(submittedAt));
        }

        for (String amenity : amenitiesFor(random, place)) {
            inserted += jdbc.update(
                    "insert into listing_amenities (listing_id, amenity_id) values (?, ?) on conflict do nothing",
                    listingId, amenityIds.get(amenity));
        }

        // Availability: pending listings open next week; some live ones have a blocked fortnight.
        List<LocalDate[]> windows = new ArrayList<>();
        if (status == ListingStatus.PENDING) {
            windows.add(new LocalDate[] {today.plusDays(7), today.plusDays(180)});
        } else if (index % 5 == 0) {
            windows.add(new LocalDate[] {today.minusDays(120), today.plusDays(40)});
            windows.add(new LocalDate[] {today.plusDays(55), today.plusDays(180)});
        } else {
            windows.add(new LocalDate[] {today.minusDays(120), today.plusDays(180)});
        }
        for (int w = 0; w < windows.size(); w++) {
            inserted += jdbc.update("""
                    insert into availability (id, listing_id, start_date, end_date, created_at)
                    values (?, ?, ?, ?, ?)
                    on conflict do nothing
                    """,
                    seedId("availability", index + "/" + w), listingId, windows.get(w)[0], windows.get(w)[1],
                    ts(submittedAt));
        }

        if (status != ListingStatus.PENDING) {
            // A removed listing takes no new bookings, but stays booked before removal remain (issue #23).
            Instant latestBooking = removedAt != null ? removedAt : now;
            inserted += seedBookings(index, listingId, random, now, today, zone, windows, checkInTime,
                    checkOutTime, price, type.maxGuests(), customerIds, latestBooking, removedAt == null);
        }
        return inserted;
    }

    /** Walks the calendar from ~100 days ago to 60 days ahead, placing non-overlapping stays. */
    private int seedBookings(int index, UUID listingId, Random random, Instant now, LocalDate today, ZoneId zone,
            List<LocalDate[]> windows, LocalTime checkInTime, LocalTime checkOutTime, BigDecimal price,
            int maxGuests, List<UUID> customerIds, Instant latestBooking, boolean canBeBookedToday) {
        int inserted = 0;
        LocalDate cursor = today.minusDays(100 - random.nextInt(10));
        LocalDate stopAt = today.plusDays(60);
        Instant startOfToday = today.atStartOfDay(ZoneOffset.UTC).toInstant();

        int number = 0;
        while (cursor.isBefore(stopAt)) {
            int nights = pickNights(random);
            LocalDate checkOutDate = cursor.plusDays(nights);
            if (windowContaining(windows, cursor, checkOutDate) == null) {
                LocalDate next = nextWindowStart(windows, cursor);
                if (next == null) {
                    break;
                }
                cursor = next;
                continue;
            }

            Instant checkIn = cursor.atTime(checkInTime).atZone(zone).toInstant();
            Instant checkOut = checkOutDate.atTime(checkOutTime).atZone(zone).toInstant();
            Instant createdAt;
            if (checkIn.isBefore(now)) {
                createdAt = checkIn.minus(days(1 + random.nextInt(45))).minus(hours(random.nextInt(24)));
            } else if (canBeBookedToday && random.nextInt(6) == 0) {
                // Feeds "booked N times today" on the search cards.
                long secondsSinceMidnight = Duration.between(startOfToday, now).getSeconds();
                createdAt = now.minusSeconds((long) (random.nextDouble() * secondsSinceMidnight));
            } else {
                createdAt = latestBooking.minus(hours(1 + random.nextInt(24 * 30)));
            }
            if (createdAt.isAfter(latestBooking)) {
                // Removed listings stop taking bookings; skip stays that would have been booked afterwards.
                cursor = checkOutDate.plusDays(random.nextInt(12));
                continue;
            }

            boolean cancelled = random.nextInt(10) == 0;
            Instant cancelledAt = null;
            if (cancelled) {
                cancelledAt = min(createdAt.plus(hours(1 + random.nextInt(72))), checkIn.minus(hours(1)), now);
            }
            int guests = 1 + random.nextInt(maxGuests);
            UUID customerId = customerIds.get(random.nextInt(customerIds.size()));
            UUID bookingId = seedId("booking", index + "/" + number++);

            inserted += jdbc.update("""
                    insert into bookings (id, listing_id, customer_id, check_in, check_out, guests, total_cost,
                        status, cancelled_at, created_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    on conflict do nothing
                    """,
                    bookingId, listingId, customerId, ts(checkIn), ts(checkOut), guests,
                    price.multiply(BigDecimal.valueOf(nights)),
                    (cancelled ? BookingStatus.CANCELLED : BookingStatus.CONFIRMED).value(), ts(cancelledAt),
                    ts(createdAt));

            if (!cancelled && checkOut.isBefore(now) && random.nextInt(100) < 55) {
                inserted += seedReview(bookingId, random, checkOut.plus(hours(12 + random.nextInt(24 * 6))), now);
            }

            cursor = checkOutDate.plusDays(random.nextInt(12));
        }
        return inserted;
    }

    private int seedReview(UUID bookingId, Random random, Instant createdAt, Instant now) {
        int rating = pickRating(random);
        String comment = pick(random, REVIEW_COMMENTS.get(rating - 1));
        if (createdAt.isAfter(now)) {
            return 0;
        }
        // Reads the stay back, so a review is only written for a confirmed booking that has ended.
        return jdbc.update("""
                insert into reviews (id, listing_id, customer_id, booking_id, rating, comment, created_at)
                select ?, b.listing_id, b.customer_id, b.id, ?, ?, ?
                from bookings b
                where b.id = ? and b.status = 'confirmed' and b.check_out < ?
                on conflict do nothing
                """,
                seedId("review", bookingId), rating, comment, ts(createdAt), bookingId, ts(createdAt));
    }

    private int insertUser(Role role, Person person, String passwordHash, Instant createdAt) {
        return jdbc.update("""
                insert into users (id, role, name, email, password_hash, phone, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict do nothing
                """,
                seedId("user", person.email()), role.value(), person.name(), person.email(), passwordHash,
                person.phone(), ts(createdAt), ts(createdAt));
    }

    private UUID userId(String email) {
        return jdbc.queryForObject("select id from users where email = ?", UUID.class, email);
    }

    private static List<String> amenitiesFor(Random random, Place place) {
        List<String> pool = new ArrayList<>(List.of(
                "Kitchen", "Free parking", "Washer", "Dryer", "Hot tub", "Pool", "Fireplace", "Air conditioning",
                "Pets allowed", "Gym", "Elevator"));
        if (place.coastal()) {
            pool.add("Beach access");
        }
        Collections.shuffle(pool, random);
        List<String> picked = new ArrayList<>();
        if (random.nextInt(10) != 0) {
            picked.add("Wifi");
        }
        picked.addAll(pool.subList(0, 3 + random.nextInt(5)));
        return picked;
    }

    /** Mostly short breaks, some week-long stays, a few up to the 14-night limit. */
    private static int pickNights(Random random) {
        int roll = random.nextInt(100);
        if (roll < 45) {
            return 1 + random.nextInt(3);
        }
        if (roll < 90) {
            return 4 + random.nextInt(4);
        }
        return 8 + random.nextInt(7);
    }

    private static int pickRating(Random random) {
        int roll = random.nextInt(100);
        return roll < 50 ? 5 : roll < 82 ? 4 : roll < 94 ? 3 : roll < 98 ? 2 : 1;
    }

    private static LocalDate[] windowContaining(List<LocalDate[]> windows, LocalDate checkIn, LocalDate checkOut) {
        for (LocalDate[] window : windows) {
            if (!checkIn.isBefore(window[0]) && !checkOut.isAfter(window[1])) {
                return window;
            }
        }
        return null;
    }

    private static LocalDate nextWindowStart(List<LocalDate[]> windows, LocalDate after) {
        return windows.stream()
                .map(window -> window[0])
                .filter(start -> start.isAfter(after))
                .min(LocalDate::compareTo)
                .orElse(null);
    }

    /** Stable ids are what make the seed idempotent: the same row always gets the same key. */
    static UUID seedId(String kind, Object key) {
        return UUID.nameUUIDFromBytes(("stayfinder-seed:" + kind + ":" + key).getBytes(StandardCharsets.UTF_8));
    }

    private static <T> T pick(Random random, List<T> options) {
        return options.get(random.nextInt(options.size()));
    }

    private static Instant min(Instant... values) {
        Instant result = values[0];
        for (Instant value : values) {
            if (value.isBefore(result)) {
                result = value;
            }
        }
        return result;
    }

    private static double round6(double value) {
        return Math.round(value * 1_000_000d) / 1_000_000d;
    }

    private static Duration days(long days) {
        return Duration.ofDays(days);
    }

    private static Duration hours(long hours) {
        return Duration.ofHours(hours);
    }

    /** OffsetDateTime binds as timestamptz, whatever the JVM's default zone is. */
    private static OffsetDateTime ts(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

    /** Row counts after a run, logged by the seed profile and checked by the tests. */
    public record SeedReport(
            int insertedRows,
            long admins,
            long hosts,
            long customers,
            long listings,
            Map<String, Long> listingsByStatus,
            long cities,
            long zipCodes,
            long photos,
            long bookings,
            long reviews) {

        static SeedReport read(JdbcTemplate jdbc, int insertedRows) {
            Map<String, Long> byRole = countBy(jdbc, "select role as k, count(*) as n from users group by role");
            Map<String, Long> byStatus = countBy(jdbc,
                    "select status as k, count(*) as n from listings group by status");
            return new SeedReport(
                    insertedRows,
                    byRole.getOrDefault("admin", 0L),
                    byRole.getOrDefault("host", 0L),
                    byRole.getOrDefault("customer", 0L),
                    count(jdbc, "select count(*) from listings"),
                    byStatus,
                    count(jdbc, "select count(distinct (city, state)) from listings"),
                    count(jdbc, "select count(distinct zip) from listings"),
                    count(jdbc, "select count(*) from listing_photos"),
                    count(jdbc, "select count(*) from bookings"),
                    count(jdbc, "select count(*) from reviews"));
        }

        private static long count(JdbcTemplate jdbc, String sql) {
            Long value = jdbc.queryForObject(sql, Long.class);
            return value == null ? 0 : value;
        }

        private static Map<String, Long> countBy(JdbcTemplate jdbc, String sql) {
            return jdbc.queryForList(sql).stream().collect(Collectors.toMap(
                    row -> (String) row.get("k"), row -> ((Number) row.get("n")).longValue(),
                    (a, b) -> a, TreeMap::new));
        }

        @Override
        public String toString() {
            return ("Seed finished: inserted %d new rows (0 means everything was already there). Database now has"
                    + " %d admin, %d hosts, %d customers, %d listings %s in %d cities / %d zip codes,"
                    + " %d photos, %d bookings, %d reviews").formatted(
                    insertedRows, admins, hosts, customers, listings, listingsByStatus, cities, zipCodes, photos,
                    bookings, reviews);
        }
    }
}
