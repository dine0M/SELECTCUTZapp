<?php
require_once 'common.php';
require_once '../db.php';

require_admin();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    json_error('Use POST for admin actions.', 405);
}

$d = input_json();
$action = $d['action'] ?? '';

if ($action === 'reports') {
    $out = [
        'summary' => [
            'TotalCustomers' => 0,
            'TotalBookings' => 0,
            'TotalServices' => 0,
            'TotalRevenue' => 0
        ],
        'popularServices' => [],
        'customerActivity' => []
    ];

    try {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        $queries = [
            [
                'TotalCustomers',
                "SELECT COUNT(*) AS total FROM customers"
            ],
            [
                'TotalBookings',
                "SELECT COUNT(*) AS total FROM bookings"
            ],
            [
                'TotalServices',
                "SELECT COUNT(*) AS total FROM services"
            ],
            [
                'TotalRevenue',
                "SELECT COALESCE(SUM(FinalAmount),0) AS total
                 FROM paymentstatus
                 WHERE Status='Paid'"
            ]
        ];

        foreach ($queries as $query) {
            $result = $conn->query($query[1]);
            $out['summary'][$query[0]] =
                $result->fetch_assoc()['total'];
        }

        $result = $conn->query(
            "SELECT
                s.ServiceName,
                COALESCE(b.TotalBookings,0) AS TotalBookings,
                COALESCE(p.Revenue,0) AS Revenue
             FROM services s
             LEFT JOIN (
                SELECT ServiceID, COUNT(*) AS TotalBookings
                FROM bookings
                WHERE COALESCE(BookingStatus,'') <> 'Cancelled'
                GROUP BY ServiceID
             ) b ON b.ServiceID=s.ServiceID
             LEFT JOIN (
                SELECT
                    bookings.ServiceID,
                    SUM(paymentstatus.FinalAmount) AS Revenue
                FROM bookings
                JOIN paymentstatus
                    ON paymentstatus.BookingID=bookings.BookingID
                WHERE paymentstatus.Status='Paid'
                GROUP BY bookings.ServiceID
             ) p ON p.ServiceID=s.ServiceID
             ORDER BY TotalBookings DESC, s.ServiceID"
        );

        while ($row = $result->fetch_assoc()) {
            $out['popularServices'][] = $row;
        }

        $result = $conn->query(
            "SELECT
                c.FullName,
                c.Email,
                COUNT(b.BookingID) AS TotalBookings
             FROM customers c
             LEFT JOIN bookings b ON b.CustomerID=c.CustomerID
             GROUP BY c.CustomerID,c.FullName,c.Email
             ORDER BY TotalBookings DESC,c.CustomerID"
        );

        while ($row = $result->fetch_assoc()) {
            $out['customerActivity'][] = $row;
        }

        echo json_encode($out);
        exit;
    } catch (Throwable $error) {
        error_log('Admin reports failed: ' . $error->getMessage());
        json_error('Unable to load reports. Please try again.', 500);
    }
}

if ($action === 'allBookings') {
    try {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        $result = $conn->query(
            "SELECT
                b.BookingID,
                c.FullName,
                s.ServiceName,
                b.BookingDate,
                b.BookingTime,
                b.BookingStatus,
                b.BookingAmount
             FROM bookings b
             JOIN customers c ON c.CustomerID=b.CustomerID
             JOIN services s ON s.ServiceID=b.ServiceID
             ORDER BY b.DateCreated DESC,b.BookingID DESC"
        );

        $data = [];

        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        echo json_encode($data);
        exit;
    } catch (Throwable $error) {
        error_log('Admin bookings failed: ' . $error->getMessage());
        json_error('Unable to load bookings. Please try again.', 500);
    }
}

if ($action === 'addService') {
    $name = trim((string)($d['name'] ?? ''));
    $description = trim((string)($d['description'] ?? ''));
    $category = trim((string)($d['category'] ?? ''));
    $priceInput = trim((string)($d['price'] ?? ''));

    $duration = filter_var(
        $d['duration'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 600]]
    );

    if ($name === '' || strlen($name) > 100) {
        json_error('Service name is required and must not exceed 100 bytes.');
    }

    if (strlen($description) > 10000 || strlen($category) > 50) {
        json_error('Service description or category is too long.');
    }

    if (
        !preg_match('/^\d{1,8}(?:\.\d{1,2})?$/', $priceInput) ||
        $duration === false
    ) {
        json_error(
            'Provide a valid non-negative price and a duration from 1 to 600 minutes.'
        );
    }

    $image = save_uploaded_image(
        $d['imageData'] ?? '',
        $d['imageName'] ?? '',
        'service'
    );

    if ($image === '') {
        json_error('Please select a valid JPG, PNG or WebP service image.');
    }

    try {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        $s = $conn->prepare(
            "INSERT INTO services
             (ServiceName,Description,Price,Duration,Category,ServiceImage)
             VALUES(?,?,?,?,?,?)"
        );
        $s->bind_param(
            'sssiss',
            $name,
            $description,
            $priceInput,
            $duration,
            $category,
            $image
        );
        $s->execute();

        json_ok([
            'message' => 'Service added successfully.',
            'serviceId' => $conn->insert_id
        ]);
    } catch (Throwable $error) {
        // Remove the uploaded image if the database insert failed.
        $uploadedPath = __DIR__ . '/' . $image;

        if (is_file($uploadedPath)) {
            @unlink($uploadedPath);
        }

        error_log('Add service failed: ' . $error->getMessage());
        json_error('Unable to add service. Please try again.', 500);
    }
}

if ($action === 'deleteService') {
    $id = filter_var(
        $d['serviceId'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if ($id === false) {
        json_error('Invalid service.');
    }

    try {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        $s = $conn->prepare(
            "UPDATE services
             SET AvailabilityStatus='Unavailable'
             WHERE ServiceID=?"
        );
        $s->bind_param('i', $id);
        $s->execute();

        if ($s->affected_rows === 0) {
            $check = $conn->prepare(
                "SELECT ServiceID FROM services WHERE ServiceID=?"
            );
            $check->bind_param('i', $id);
            $check->execute();

            if (!$check->get_result()->fetch_assoc()) {
                json_error('Service not found.', 404);
            }
        }

        json_ok([
            'message' =>
                'Service removed from the catalogue. Booking history is preserved.'
        ]);
    } catch (Throwable $error) {
        error_log('Deactivate service failed: ' . $error->getMessage());
        json_error('Unable to deactivate service. Please try again.', 500);
    }
}

if ($action === 'completeBooking') {
    $bid = filter_var(
        $d['bookingId'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if ($bid === false) {
        json_error('Invalid booking.');
    }

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $inTransaction = false;

    try {
        $conn->begin_transaction();
        $inTransaction = true;

        $q = $conn->prepare(
            "SELECT
                b.CustomerID,
                b.BookingStatus,
                TIMESTAMPADD(
                    MINUTE,
                    s.Duration,
                    TIMESTAMP(b.BookingDate,b.BookingTime)
                ) AS AppointmentEnd
             FROM bookings b
             JOIN services s ON s.ServiceID=b.ServiceID
             WHERE b.BookingID=?
             FOR UPDATE"
        );
        $q->bind_param('i', $bid);
        $q->execute();

        $booking = $q->get_result()->fetch_assoc();

        if (!$booking) {
            $conn->rollback();
            $inTransaction = false;
            json_error('Booking not found.', 404);
        }

        if ($booking['BookingStatus'] === 'Completed') {
            $conn->commit();
            $inTransaction = false;

            json_ok([
                'message' => 'Booking is already completed.'
            ]);
        }

        if ($booking['BookingStatus'] !== 'Confirmed') {
            $conn->rollback();
            $inTransaction = false;

            json_error(
                'Only confirmed bookings can be completed.',
                409
            );
        }

        $timezone = new DateTimeZone('Africa/Johannesburg');

        $appointmentEnd = new DateTimeImmutable(
            $booking['AppointmentEnd'],
            $timezone
        );

        if ($appointmentEnd > new DateTimeImmutable('now', $timezone)) {
            $conn->rollback();
            $inTransaction = false;

            json_error(
                'The appointment must finish before it can be completed.',
                409
            );
        }

        $u = $conn->prepare(
            "UPDATE bookings
             SET BookingStatus='Completed'
             WHERE BookingID=?"
        );
        $u->bind_param('i', $bid);
        $u->execute();

        $customerId = (int)$booking['CustomerID'];
        $message =
            'Your appointment is complete. Thank you for visiting SELECT CUTZ.';

        $n = $conn->prepare(
            "INSERT INTO notifications(CustomerID,BookingID,Message)
             VALUES(?,?,?)"
        );
        $n->bind_param('iis', $customerId, $bid, $message);
        $n->execute();

        $conn->commit();
        $inTransaction = false;

        json_ok([
            'message' => 'Booking marked as completed.'
        ]);
    } catch (Throwable $error) {
        if ($inTransaction) {
            $conn->rollback();
        }

        error_log('Complete booking failed: ' . $error->getMessage());
        json_error('Unable to complete booking. Please try again.', 500);
    }
}

json_error('Invalid admin action.');
