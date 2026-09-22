package dev.stayfinder.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** A listing's street address. lat/lng stay null until the address is geocoded. */
@Embeddable
public class Address {

    @Column(name = "address_line1", nullable = false, length = 200)
    private String line1;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 2)
    private String state;

    @Column(nullable = false, length = 5)
    private String zip;

    private Double lat;

    private Double lng;

    protected Address() {
    }

    public Address(String line1, String city, String state, String zip, Double lat, Double lng) {
        this.line1 = line1;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.lat = lat;
        this.lng = lng;
    }

    public String getLine1() {
        return line1;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getZip() {
        return zip;
    }

    public Double getLat() {
        return lat;
    }

    public Double getLng() {
        return lng;
    }
}
