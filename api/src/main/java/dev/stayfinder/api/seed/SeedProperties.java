package dev.stayfinder.api.seed;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings for {@link DatabaseSeeder}, bound from the {@code seed.*} keys in application.yml.
 *
 * @param adminEmail    login for the single admin account
 * @param adminPassword admin password; when blank a random one is generated and printed once,
 *                      so no admin credential ever lives in the repo (issue #7)
 * @param demoPassword  password shared by the demo hosts and customers
 * @param reset         wipe every user, listing, booking and review before seeding
 */
@ConfigurationProperties("seed")
public record SeedProperties(String adminEmail, String adminPassword, String demoPassword, boolean reset) {
}
