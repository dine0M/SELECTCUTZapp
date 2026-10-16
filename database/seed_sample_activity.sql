-- Local assignment data only. Run once.
START TRANSACTION;

CREATE TEMPORARY TABLE seed_numbers (n INT PRIMARY KEY);
INSERT INTO seed_numbers VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

INSERT INTO services
    (ServiceName, Description, Price, Duration, Category,
     ServiceImage, AvailabilityStatus)
SELECT
    CONCAT('Sample Grooming Service ', n),
    'Fictional service for assignment demonstration.',
    100.00 + (n * 10),
    30,
    'Sample',
    'assets/uploads/haircut1.jpeg',
    'Unavailable'
FROM seed_numbers;

INSERT INTO bookings
    (CustomerID, ServiceID, BookingDate, BookingTime,
     BookingStatus, BookingAmount)
SELECT
    c.CustomerID,
    s.ServiceID,
    DATE_ADD('2026-09-01', INTERVAL numbers.n DAY),
    '10:00:00',
    'Completed',
    s.Price
FROM seed_numbers numbers
JOIN customers c
    ON c.Email = CONCAT('sample.customer.', numbers.n, '@example.com')
JOIN services s
    ON s.ServiceName = CONCAT('Sample Grooming Service ', numbers.n);

INSERT INTO paymentstatus
    (BookingID, AmountDue, DiscountApplied, FinalAmount, Status)
SELECT
    b.BookingID, b.BookingAmount, 0, b.BookingAmount, 'Paid'
FROM bookings b
JOIN customers c ON c.CustomerID = b.CustomerID
JOIN services s ON s.ServiceID = b.ServiceID
JOIN seed_numbers numbers
    ON c.Email = CONCAT('sample.customer.', numbers.n, '@example.com')
    AND s.ServiceName = CONCAT('Sample Grooming Service ', numbers.n);

INSERT INTO notifications
    (CustomerID, BookingID, Message, NotificationStatus)
SELECT
    b.CustomerID,
    b.BookingID,
    'Sample appointment completed. Thank you for visiting.',
    'Read'
FROM bookings b
JOIN customers c ON c.CustomerID = b.CustomerID
JOIN services s ON s.ServiceID = b.ServiceID
JOIN seed_numbers numbers
    ON c.Email = CONCAT('sample.customer.', numbers.n, '@example.com')
    AND s.ServiceName = CONCAT('Sample Grooming Service ', numbers.n);

INSERT INTO loyaltydiscounts
    (CustomerID, DiscountPercentage, EligibilityStatus,
     RewardDate, ExpiryDate)
SELECT
    c.CustomerID, 0, 'Not Qualified', NULL, NULL
FROM customers c
JOIN seed_numbers numbers
    ON c.Email = CONCAT('sample.customer.', numbers.n, '@example.com');

INSERT INTO reports
    (AdminID, ReportType, DateRangeStart, DateRangeEnd)
SELECT
    a.AdminID,
    'Sample Monthly Summary',
    '2026-09-01',
    '2026-09-30'
FROM admins a
JOIN seed_numbers numbers
    ON a.Username = CONCAT('sample.admin.', numbers.n, '@example.com');

DROP TEMPORARY TABLE seed_numbers;
COMMIT;
