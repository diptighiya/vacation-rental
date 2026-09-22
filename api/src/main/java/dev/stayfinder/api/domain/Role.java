package dev.stayfinder.api.domain;

import jakarta.persistence.Converter;
import java.util.Locale;

public enum Role {
    CUSTOMER, HOST, ADMIN;

    /** The value used in the database and in JSON. */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    @Converter(autoApply = true)
    public static class JpaConverter extends LowercaseEnumConverter<Role> {
        public JpaConverter() {
            super(Role.class);
        }
    }
}
