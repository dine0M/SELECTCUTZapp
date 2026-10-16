-- Apply once after migration 003.
-- Track the booking on which a loyalty reward was used.
ALTER TABLE loyaltydiscounts
    ADD COLUMN BookingID INT NULL,
    ADD UNIQUE KEY unique_loyalty_booking (BookingID),
    ADD CONSTRAINT loyalty_booking_fk
        FOREIGN KEY (BookingID)
        REFERENCES bookings(BookingID)
        ON DELETE RESTRICT;
