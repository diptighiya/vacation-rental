package dev.stayfinder.api;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stayfinder.api.domain.Listing;
import dev.stayfinder.api.domain.ListingStatus;
import dev.stayfinder.api.domain.Role;
import dev.stayfinder.api.seed.DatabaseSeeder;
import dev.stayfinder.api.seed.DatabaseSeeder.SeedReport;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

/** Issue #3: the seed meets the sprint targets, follows the booking rules and is idempotent. */
class SeedDataTest extends PostgresTest {

    @Autowired
    DatabaseSeeder seeder;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    EntityManager entityManager;

    @Autowired
    TransactionTemplate transactions;

    SeedReport report;

    @BeforeEach
    void seed() {
        report = seeder.seed();
    }

    @Test
    void meetsTheSprintOneTargets() {
        assertThat(report.listings()).isGreaterThanOrEqualTo(50);
        assertThat(report.cities()).isGreaterThanOrEqualTo(10);
        assertThat(report.zipCodes()).isGreaterThanOrEqualTo(10);
        assertThat(report.hosts()).isGreaterThanOrEqualTo(5);
        assertThat(report.customers()).isGreaterThanOrEqualTo(20);
        assertThat(report.admins()).isEqualTo(1);
        assertThat(report.listingsByStatus()).containsOnlyKeys("pending", "approved", "removed");
        assertThat(report.reviews()).isPositive();
    }

    @Test
    void everyLiveListingHasPhotosAmenitiesAndCoordinates() {
        assertThat(count("""
                select count(*) from listings l
                where l.status = 'approved'
                  and (l.lat is null or l.lng is null
                       or not exists (select 1 from listing_photos p where p.listing_id = l.id)
                       or not exists (select 1 from listing_amenities a where a.listing_id = l.id))
                """)).isZero();
    }

    @Test
    void bookingsAreSpreadSoThirtySixtyAndNinetyDaysDiffer() {
        long last30 = count("select count(*) from bookings where created_at >= now() - interval '30 days'");
        long last60 = count("select count(*) from bookings where created_at >= now() - interval '60 days'");
        long last90 = count("select count(*) from bookings where created_at >= now() - interval '90 days'");

        assertThat(last30).isPositive();
        assertThat(last60).isGreaterThan(last30);
        assertThat(last90).isGreaterThan(last60);
        assertThat(count("select count(*) from bookings where check_in > now()")).isPositive();
        assertThat(count("select count(*) from bookings where status = 'cancelled'")).isPositive();
    }

    @Test
    void bookingsFollowTheBookingRules() {
        // Guests within capacity, 1-14 nights, total = nights x price, inside an availability window,
        // only on listings that were live, and never booked after the stay began.
        assertThat(count("""
                select count(*) from bookings b join listings l on l.id = b.listing_id
                where b.guests > l.max_guests
                   or nights(b, l) not between 1 and 14
                   or b.total_cost <> nights(b, l) * l.price_per_night
                   or l.status = 'pending'
                   or b.created_at >= b.check_in
                   or not exists (
                        select 1 from availability a
                        where a.listing_id = l.id
                          and (b.check_in at time zone l.time_zone)::date >= a.start_date
                          and (b.check_out at time zone l.time_zone)::date <= a.end_date)
                """.replace("nights(b, l)",
                "((b.check_out at time zone l.time_zone)::date - (b.check_in at time zone l.time_zone)::date)")))
                .isZero();
    }

    @Test
    void reviewsOnlyFollowCompletedStays() {
        assertThat(count("""
                select count(*) from reviews r join bookings b on b.id = r.booking_id
                where b.status <> 'confirmed' or r.created_at <= b.check_out or r.created_at > now()
                   or r.customer_id <> b.customer_id or r.listing_id <> b.listing_id
                """)).isZero();
    }

    @Test
    void runningAgainChangesNothing() {
        List<Long> before = tableCounts();

        SeedReport again = seeder.seed();

        assertThat(again.insertedRows()).isZero();
        assertThat(tableCounts()).isEqualTo(before);
    }

    @Test
    void demoAndAdminAccountsCanSignIn() {
        var encoder = new BCryptPasswordEncoder();
        String hostHash = jdbc.queryForObject(
                "select password_hash from users where email = 'nina.host@stayfinder.dev' and role = 'host'",
                String.class);
        String adminHash = jdbc.queryForObject(
                "select password_hash from users where email = 'admin@stayfinder.dev' and role = 'admin'",
                String.class);

        assertThat(encoder.matches("demo1234", hostHash)).isTrue();
        assertThat(encoder.matches("test-admin-password", adminHash)).isTrue();
    }

    @Test
    void entitiesLoadSeededRows() {
        transactions.executeWithoutResult(status -> {
            Listing listing = entityManager
                    .createQuery("select l from Listing l where l.status = :status order by l.title", Listing.class)
                    .setParameter("status", ListingStatus.APPROVED)
                    .setMaxResults(1)
                    .getSingleResult();

            assertThat(listing.getHost().getRole()).isEqualTo(Role.HOST);
            assertThat(listing.getPhotos()).isNotEmpty();
            assertThat(listing.getPhotos().get(0).getPosition()).isZero();
            assertThat(listing.getAmenities()).isNotEmpty();
            assertThat(listing.getAvailability()).isNotEmpty();
            assertThat(listing.getAddress().getZip()).matches("\\d{5}");
        });
    }

    private List<Long> tableCounts() {
        return List.of("users", "listings", "listing_photos", "listing_amenities", "availability", "bookings",
                        "reviews")
                .stream()
                .map(table -> count("select count(*) from " + table))
                .toList();
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }
}
