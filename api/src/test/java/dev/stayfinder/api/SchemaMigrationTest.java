package dev.stayfinder.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/** Issue #2: the migrations build the full schema on an empty database, and Hibernate's
 *  ddl-auto=validate (which runs while this context starts) agrees with the entities.
 *  Each test rolls back, so nothing here leaks into the seed tests. */
@Transactional
class SchemaMigrationTest extends PostgresTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void createsEveryTable() {
        var tables = jdbc.queryForList(
                "select table_name from information_schema.tables"
                        + " where table_schema = 'public' and table_type = 'BASE TABLE'",
                String.class);

        assertThat(tables).contains(
                "users", "listings", "listing_photos", "amenities", "listing_amenities",
                "availability", "bookings", "reviews");
    }

    @Test
    void loadsThePredefinedAmenities() {
        assertThat(jdbc.queryForObject("select count(*) from amenities", Integer.class)).isEqualTo(13);
    }

    @Test
    void rejectsUnknownStatuses() {
        UUID host = insertUser("host", "status-host@example.com", "408-555-0100");

        assertThatThrownBy(() -> insertListing(host, "draft"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void requiresAPhoneForHosts() {
        assertThatThrownBy(() -> insertUser("host", "no-phone-host@example.com", null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void blocksOverlappingConfirmedBookings() {
        UUID host = insertUser("host", "overlap-host@example.com", "408-555-0101");
        UUID guest = insertUser("customer", "overlap-guest@example.com", null);
        UUID listing = insertListing(host, "approved");

        insertBooking(listing, guest, "2026-10-01T22:00:00Z", "2026-10-04T18:00:00Z", "confirmed");
        // Back-to-back stays are fine: check-out and the next check-in can share a day.
        insertBooking(listing, guest, "2026-10-04T22:00:00Z", "2026-10-06T18:00:00Z", "confirmed");
        // Cancelled stays don't hold the dates.
        insertBooking(listing, guest, "2026-10-02T22:00:00Z", "2026-10-03T18:00:00Z", "cancelled");

        assertThatThrownBy(() ->
                        insertBooking(listing, guest, "2026-10-03T22:00:00Z", "2026-10-05T18:00:00Z", "confirmed"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("bookings_no_overlap");
    }

    private UUID insertUser(String role, String email, String phone) {
        return jdbc.queryForObject(
                "insert into users (role, name, email, password_hash, phone)"
                        + " values (?, 'Test User', ?, 'not-a-real-hash', ?) returning id",
                UUID.class, role, email, phone);
    }

    private UUID insertListing(UUID host, String status) {
        return jdbc.queryForObject(
                "insert into listings (host_id, title, description, address_line1, city, state, zip,"
                        + " price_per_night, max_guests, status)"
                        + " values (?, 'Test listing', 'A listing used by the schema tests.',"
                        + " '1 Test St', 'San Jose', 'CA', '95126', 150, 4, ?) returning id",
                UUID.class, host, status);
    }

    private void insertBooking(UUID listing, UUID guest, String checkIn, String checkOut, String status) {
        jdbc.update(
                "insert into bookings (listing_id, customer_id, check_in, check_out, guests, total_cost,"
                        + " status, cancelled_at)"
                        + " values (?, ?, ?::timestamptz, ?::timestamptz, 2, 300, ?,"
                        + " case when ? = 'cancelled' then now() end)",
                listing, guest, checkIn, checkOut, status, status);
    }
}
