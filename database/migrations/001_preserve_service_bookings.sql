-- Apply once to an existing database using the original schema.
-- Preserve booking history when a service is deleted.
ALTER TABLE bookings
    DROP FOREIGN KEY bookings_ibfk_2,
    ADD CONSTRAINT bookings_service_fk
        FOREIGN KEY (ServiceID)
        REFERENCES services(ServiceID)
        ON DELETE RESTRICT;
