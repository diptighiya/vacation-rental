package dev.stayfinder.api.seed;

import java.util.List;

/** The fixed people, places and wording the seeder builds its data from. */
final class SeedCatalog {

    private SeedCatalog() {
    }

    record Person(String name, String email, String phone) {
    }

    record Place(
            String city,
            String state,
            String zip,
            String neighborhood,
            double lat,
            double lng,
            boolean coastal,
            String pitch,
            List<String> streets) {

        String timeZone() {
            return switch (state) {
                case "AZ" -> "America/Phoenix";
                case "CO" -> "America/Denver";
                case "TX" -> "America/Chicago";
                case "NY" -> "America/New_York";
                default -> "America/Los_Angeles";
            };
        }
    }

    record PropertyType(String name, String blurb, int maxGuests, int minPrice, int maxPrice) {
    }

    /** nina.host@ matches the demo account on the web login page. */
    static final List<Person> HOSTS = List.of(
            new Person("Nina Patel", "nina.host@stayfinder.dev", "(408) 555-0142"),
            new Person("Marcus Lee", "marcus.host@stayfinder.dev", "(415) 555-0178"),
            new Person("Elena Garcia", "elena.host@stayfinder.dev", "(831) 555-0119"),
            new Person("Tom Becker", "tom.host@stayfinder.dev", "(530) 555-0164"),
            new Person("Priya Raman", "priya.host@stayfinder.dev", "(503) 555-0131"),
            new Person("Jordan Brooks", "jordan.host@stayfinder.dev", "(512) 555-0187"));

    /** sam.customer@ matches the demo account on the web login page. */
    static final List<Person> CUSTOMERS = List.of(
            new Person("Sam Carter", "sam.customer@stayfinder.dev", "(669) 555-0102"),
            new Person("Ava Nguyen", "ava.nguyen@example.com", null),
            new Person("Liam Johnson", "liam.johnson@example.com", null),
            new Person("Sofia Martinez", "sofia.martinez@example.com", null),
            new Person("Noah Kim", "noah.kim@example.com", null),
            new Person("Mia Thompson", "mia.thompson@example.com", null),
            new Person("Ethan Wright", "ethan.wright@example.com", null),
            new Person("Isabella Rossi", "isabella.rossi@example.com", null),
            new Person("Lucas Silva", "lucas.silva@example.com", null),
            new Person("Chloe Bennett", "chloe.bennett@example.com", null),
            new Person("Mateo Alvarez", "mateo.alvarez@example.com", null),
            new Person("Grace Chen", "grace.chen@example.com", null),
            new Person("Owen Murphy", "owen.murphy@example.com", null),
            new Person("Zoe Adams", "zoe.adams@example.com", null),
            new Person("Daniel Park", "daniel.park@example.com", null),
            new Person("Emily Foster", "emily.foster@example.com", null),
            new Person("Aarav Shah", "aarav.shah@example.com", null),
            new Person("Hannah Weiss", "hannah.weiss@example.com", null),
            new Person("Leo Tanaka", "leo.tanaka@example.com", null),
            new Person("Maya Okafor", "maya.okafor@example.com", null),
            new Person("Ryan O'Connor", "ryan.oconnor@example.com", null),
            new Person("Nora Lindqvist", "nora.lindqvist@example.com", null),
            new Person("Samuel Reyes", "samuel.reyes@example.com", null),
            new Person("Julia Novak", "julia.novak@example.com", null));

    /** 16 cities, 22 zip codes. Coordinates are neighborhood centers; listings are jittered around them. */
    static final List<Place> PLACES = List.of(
            new Place("San Jose", "CA", "95126", "Rose Garden", 37.3318, -121.9168, false,
                    "The Municipal Rose Garden is two blocks away and downtown is a ten-minute drive.",
                    List.of("Dana Ave", "Hanchett Ave", "University Ave")),
            new Place("San Jose", "CA", "95125", "Willow Glen", 37.2952, -121.8930, false,
                    "Lincoln Avenue's cafés and the Saturday farmers market are a short walk away.",
                    List.of("Lincoln Ave", "Minnesota Ave", "Bird Ave")),
            new Place("San Jose", "CA", "95112", "Japantown", 37.3480, -121.8940, false,
                    "Japantown's ramen shops and the Sunday market are around the corner.",
                    List.of("N 5th St", "Jackson St", "E Taylor St")),
            new Place("San Francisco", "CA", "94110", "the Mission", 37.7486, -122.4156, false,
                    "Dolores Park, taquerias and the 24th Street BART station are all within walking distance.",
                    List.of("Valencia St", "Guerrero St", "Dolores St")),
            new Place("San Francisco", "CA", "94117", "Haight-Ashbury", 37.7702, -122.4449, false,
                    "Golden Gate Park starts at the end of the block.",
                    List.of("Page St", "Masonic Ave", "Waller St")),
            new Place("San Francisco", "CA", "94123", "the Marina", 37.8000, -122.4360, true,
                    "Chestnut Street and the waterfront path to the Golden Gate Bridge are close by.",
                    List.of("Chestnut St", "Lombard St", "Union St")),
            new Place("Santa Cruz", "CA", "95060", "the Westside", 36.9741, -122.0308, true,
                    "West Cliff Drive and Natural Bridges beach are a short bike ride away.",
                    List.of("Mission St", "Bay St", "Laurel St")),
            new Place("Santa Cruz", "CA", "95062", "Seabright", 36.9660, -122.0070, true,
                    "Seabright Beach is a five-minute walk down the hill.",
                    List.of("Seabright Ave", "East Cliff Dr", "Murray St")),
            new Place("Monterey", "CA", "93940", "New Monterey", 36.6002, -121.8947, true,
                    "Cannery Row and the aquarium are a pleasant walk along the rec trail.",
                    List.of("Lighthouse Ave", "Prescott Ave", "Van Buren St")),
            new Place("South Lake Tahoe", "CA", "96150", "Al Tahoe", 38.9399, -119.9772, false,
                    "The lake is five minutes away and the Heavenly gondola is a short drive.",
                    List.of("Pioneer Trail", "Ski Run Blvd", "Lake Tahoe Blvd")),
            new Place("Healdsburg", "CA", "95448", "the Dry Creek valley", 38.6105, -122.8697, false,
                    "Tasting rooms line the road and the Healdsburg plaza is ten minutes away.",
                    List.of("Westside Rd", "Dry Creek Rd", "Matheson St")),
            new Place("Napa", "CA", "94558", "Old Town Napa", 38.2975, -122.2869, false,
                    "Walk to the Oxbow Public Market and the riverfront restaurants.",
                    List.of("Brown St", "Seminary St", "Jefferson St")),
            new Place("Los Angeles", "CA", "90291", "Venice", 33.9850, -118.4695, true,
                    "Abbot Kinney and the boardwalk are both a few blocks away.",
                    List.of("Abbot Kinney Blvd", "Rose Ave", "Main St")),
            new Place("Los Angeles", "CA", "90026", "Echo Park", 34.0777, -118.2606, false,
                    "Echo Park Lake and the coffee shops on Sunset are down the street.",
                    List.of("Echo Park Ave", "Sunset Blvd", "Alvarado St")),
            new Place("San Diego", "CA", "92109", "Pacific Beach", 32.7978, -117.2400, true,
                    "The beach and the boardwalk are a short walk west.",
                    List.of("Garnet Ave", "Mission Blvd", "Felspar St")),
            new Place("Palm Springs", "CA", "92262", "the Movie Colony", 33.8303, -116.5453, false,
                    "Downtown Palm Canyon Drive is a ten-minute walk.",
                    List.of("Via Miraleste", "Indian Canyon Dr", "Tamarisk Rd")),
            new Place("Portland", "OR", "97214", "Buckman", 45.5147, -122.6431, false,
                    "The Belmont and Hawthorne food carts are a short walk away.",
                    List.of("SE Belmont St", "SE Hawthorne Blvd", "SE 20th Ave")),
            new Place("Seattle", "WA", "98103", "Fremont", 47.6613, -122.3426, false,
                    "Gas Works Park and the Burke-Gilman Trail are nearby.",
                    List.of("N 36th St", "Fremont Ave N", "Phinney Ave N")),
            new Place("Sedona", "AZ", "86336", "Uptown Sedona", 34.8697, -111.7610, false,
                    "Red rock trailheads start minutes from the door.",
                    List.of("Jordan Rd", "Soldiers Pass Rd", "Brewer Rd")),
            new Place("Denver", "CO", "80205", "Five Points", 39.7586, -104.9661, false,
                    "Coors Field and the RiNo breweries are a short walk away.",
                    List.of("Welton St", "Larimer St", "Champa St")),
            new Place("Austin", "TX", "78704", "Travis Heights", 30.2440, -97.7580, false,
                    "South Congress shops and Lady Bird Lake are within walking distance.",
                    List.of("S Congress Ave", "Travis Heights Blvd", "Kenwood Ave")),
            new Place("New York", "NY", "11211", "Williamsburg", 40.7128, -73.9530, false,
                    "Bedford Avenue and the L train are two blocks away.",
                    List.of("Bedford Ave", "N 6th St", "Grand St")));

    static final List<PropertyType> PROPERTY_TYPES = List.of(
            new PropertyType("studio loft",
                    "Open-plan studio with high ceilings, a queen bed and a galley kitchen.", 2, 95, 160),
            new PropertyType("garden cottage",
                    "Detached one-bedroom cottage with its own entrance and a small private garden.", 3, 110, 180),
            new PropertyType("craftsman bungalow",
                    "Two-bedroom craftsman with original woodwork and a shaded front porch.", 4, 150, 240),
            new PropertyType("Victorian flat",
                    "Top-floor flat with bay windows, two bedrooms and a claw-foot tub.", 4, 170, 260),
            new PropertyType("modern townhouse",
                    "Three-bedroom townhouse with an open kitchen and a rooftop deck.", 6, 210, 320),
            new PropertyType("shingled cottage",
                    "Two-bedroom shingled cottage with a wood stove and an outdoor shower.", 5, 180, 290),
            new PropertyType("A-frame cabin",
                    "Two-bedroom A-frame with a sleeping loft and big windows facing the trees.", 5, 160, 260),
            new PropertyType("adobe casita",
                    "One-bedroom adobe casita with a kiva fireplace and a shaded patio.", 3, 140, 230),
            new PropertyType("mid-century ranch",
                    "Three-bedroom mid-century home with clerestory windows and a big backyard.", 6, 230, 380),
            new PropertyType("family home",
                    "Four-bedroom family home with a fenced yard and room for everyone at the table.", 8, 280, 450));

    static final List<String> ADJECTIVES = List.of(
            "Sunlit", "Cozy", "Quiet", "Bright", "Airy", "Charming", "Restored", "Light-filled", "Updated",
            "Peaceful");

    static final List<String> EXTRAS = List.of(
            "Fast wifi and a proper desk make it easy to work remotely.",
            "Street parking is easy and the block is quiet at night.",
            "Kids' books, board games and a pack-and-play are in the hall closet.",
            "Fresh linens, towels and coffee for the first morning are provided.",
            "A great base for day trips, with the freeway five minutes away.",
            "The host lives nearby and is happy to share restaurant tips.");

    static final List<String> PHOTO_CAPTIONS = List.of(
            "Front of the house", "Living room", "Kitchen", "Main bedroom", "Bathroom");

    static final List<String> ADMIN_REMOVAL_REASONS = List.of(
            "Photos don't match the address on file.",
            "Address could not be verified.",
            "Duplicate of another listing from the same host.");

    static final String HOST_REMOVAL_REASON = "Removed by the host.";

    /** Review comments by star rating (index 0 = 1 star). */
    static final List<List<String>> REVIEW_COMMENTS = List.of(
            List.of("The place didn't match the listing and the host was hard to reach."),
            List.of("Not as clean as we hoped, and the hot water ran out quickly."),
            List.of(
                    "Fine for a short stay, but street noise carried at night.",
                    "Good location, though the kitchen was missing a few basics.",
                    "Okay overall. Check-in instructions arrived late."),
            List.of(
                    "Comfortable and clean. Street parking took a few minutes to find.",
                    "Great location. The wifi dropped once but came back quickly.",
                    "Lovely place, just a bit smaller than we expected.",
                    "Would book again. A couple more towels would have helped."),
            List.of(
                    "Spotless, quiet and exactly like the photos. We'd stay again.",
                    "Perfect base for the weekend, with great beds and a well-stocked kitchen.",
                    "The host replied quickly and check-in was painless.",
                    "Better than the pictures. The neighborhood was lovely for evening walks."));
}
