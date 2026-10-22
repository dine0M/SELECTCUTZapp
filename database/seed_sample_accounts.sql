-- Local assignment sample data. Do not seed production accounts.
START TRANSACTION;

CREATE TEMPORARY TABLE seed_numbers (n INT PRIMARY KEY);
INSERT INTO seed_numbers VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

SET @sample_hash = '$2y$10$UbmhCR/F5EFeoWZuLmc9guOoWzPavKQwdWI5CNlMKlj3y9qWIY.lu';

INSERT INTO customers (FullName, Email, PhoneNumber, Password)
SELECT
    CONCAT('Sample Customer ', n),
    CONCAT('sample.customer.', n, '@example.com'),
    CONCAT('000000', LPAD(n, 4, '0')),
    @sample_hash
FROM seed_numbers
WHERE NOT EXISTS (
    SELECT 1 FROM customers
    WHERE Email = CONCAT('sample.customer.', n, '@example.com')
);

INSERT INTO admins (FullName, Username, Password, Role)
SELECT
    CONCAT('Sample Admin ', n),
    CONCAT('sample.admin.', n, '@example.com'),
    @sample_hash,
    'Administrator'
FROM seed_numbers
WHERE NOT EXISTS (
    SELECT 1 FROM admins
    WHERE Username = CONCAT('sample.admin.', n, '@example.com')
);

DROP TEMPORARY TABLE seed_numbers;
COMMIT;
