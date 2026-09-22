package dev.stayfinder.api.seed;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Runs the seeder when the app starts with the {@code seed} profile:
 *  {@code ./mvnw spring-boot:run -Dspring-boot.run.profiles=seed}. */
@Component
@Profile("seed")
class SeedRunner implements ApplicationRunner {

    private final DatabaseSeeder seeder;

    SeedRunner(DatabaseSeeder seeder) {
        this.seeder = seeder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seeder.seed();
    }
}
