package dev.stayfinder.api.domain;

import jakarta.persistence.AttributeConverter;
import java.util.Locale;

/** Stores enums as the lowercase strings the JSON API uses ("host", "approved"),
 *  which is also what the CHECK constraints in V1__create_schema.sql allow. */
public abstract class LowercaseEnumConverter<E extends Enum<E>> implements AttributeConverter<E, String> {

    private final Class<E> type;

    protected LowercaseEnumConverter(Class<E> type) {
        this.type = type;
    }

    @Override
    public String convertToDatabaseColumn(E value) {
        return value == null ? null : value.name().toLowerCase(Locale.ROOT);
    }

    @Override
    public E convertToEntityAttribute(String value) {
        return value == null ? null : Enum.valueOf(type, value.toUpperCase(Locale.ROOT));
    }
}
