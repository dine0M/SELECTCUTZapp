-- Apply once after migration 002.
-- NULL allows cancelled appointments to release their slot.
ALTER TABLE bookings
    DROP INDEX unique_booking_slot,
    ADD COLUMN ActiveSlot TINYINT
        GENERATED ALWAYS AS (
            CASE WHEN BookingStatus = 'Cancelled' THEN NULL ELSE 1 END
        ) STORED,
    ADD UNIQUE KEY unique_active_booking_slot
        (ServiceID, BookingDate, BookingTime, ActiveSlot);
