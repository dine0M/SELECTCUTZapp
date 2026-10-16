-- Apply once after migration 001.
ALTER TABLE services
    ADD CONSTRAINT chk_service_price CHECK (Price >= 0),
    ADD CONSTRAINT chk_service_duration CHECK (Duration > 0);

ALTER TABLE bookings
    ADD CONSTRAINT chk_booking_amount CHECK (BookingAmount >= 0);

ALTER TABLE loyaltydiscounts
    ADD CONSTRAINT chk_discount_percentage
        CHECK (DiscountPercentage BETWEEN 0 AND 100);
