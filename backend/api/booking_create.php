<?php
require_once 'common.php';
require_once '../db.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    json_error('Use POST to create a booking.', 405);
}

$cid = require_customer();
$d = input_json();

$sid = filter_var(
    $d['serviceId'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);

$date = trim((string)($d['date'] ?? ''));
$time = trim((string)($d['time'] ?? ''));

if ($sid === false || $date === '' || $time === '') {
    json_error('Service, date and time are required.');
}

$timezone = new DateTimeZone('Africa/Johannesburg');

$start = DateTimeImmutable::createFromFormat(
    '!Y-m-d H:i',
    $date . ' ' . $time,
    $timezone
);

if (
    !$start ||
    $start->format('Y-m-d H:i') !== $date . ' ' . $time
) {
    json_error('Invalid date or time.');
}

if ($start <= new DateTimeImmutable('now', $timezone)) {
    json_error('Please choose a future appointment.');
}

// Business hours: Monday–Saturday, 08:00–18:00.
if ((int)$start->format('N') === 7) {
    json_error('The salon is closed on Sundays.');
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$locked = false;
$inTransaction = false;
$errorMessage = null;
$errorStatus = 500;
$bid = null;
$message = '';
$discountAmount = '0.00';
$amount = '0.00';

try {
    // Only one customer can be served at a time.
    // All booking creation through this endpoint shares this lock.
    $lockResult = $conn->query(
        "SELECT GET_LOCK('selectcutz_booking_create', 5) AS acquired"
    )->fetch_assoc();

    if ((int)$lockResult['acquired'] !== 1) {
        throw new RuntimeException(
            'The booking system is busy. Please try again.',
            503
        );
    }

    $locked = true;

    $conn->begin_transaction();
    $inTransaction = true;

    $customerQuery = $conn->prepare(
        "SELECT CustomerID
         FROM customers
         WHERE CustomerID=?"
    );
    $customerQuery->bind_param('i', $cid);
    $customerQuery->execute();

    if (!$customerQuery->get_result()->fetch_assoc()) {
        throw new RuntimeException(
            'Customer account was not found. Please log in again.',
            401
        );
    }

    $serviceQuery = $conn->prepare(
        "SELECT Price, ServiceName, Duration
         FROM services
         WHERE ServiceID=?
           AND AvailabilityStatus='Available'
         FOR UPDATE"
    );
    $serviceQuery->bind_param('i', $sid);
    $serviceQuery->execute();

    $service = $serviceQuery->get_result()->fetch_assoc();

    if (!$service) {
        throw new RuntimeException(
            'Selected service is unavailable.',
            404
        );
    }

    $duration = (int)$service['Duration'];

    if ($duration < 1) {
        throw new RuntimeException(
            'This service has an invalid duration. Contact the salon.',
            409
        );
    }

    $end = $start->modify('+' . $duration . ' minutes');
    $opening = $start->setTime(8, 0);
    $closing = $start->setTime(18, 0);

    if ($start < $opening || $end > $closing) {
        throw new RuntimeException(
            'Choose a time that allows the full service between 08:00 and 18:00.',
            400
        );
    }

    $startSql = $start->format('Y-m-d H:i:s');
    $endSql = $end->format('Y-m-d H:i:s');

    // Check overlaps across every service.
    // Back-to-back appointments are allowed.
    $conflict = $conn->prepare(
        "SELECT b.BookingID
         FROM bookings b
         JOIN services s ON s.ServiceID=b.ServiceID
         WHERE COALESCE(b.BookingStatus, '') <> 'Cancelled'
           AND TIMESTAMP(b.BookingDate,b.BookingTime) < ?
           AND TIMESTAMPADD(
               MINUTE,
               s.Duration,
               TIMESTAMP(b.BookingDate,b.BookingTime)
           ) > ?
         LIMIT 1"
    );
    $conflict->bind_param('ss', $endSql, $startSql);
    $conflict->execute();

    if ($conflict->get_result()->fetch_assoc()) {
        throw new RuntimeException(
            'This appointment overlaps another booking. Choose another time.',
            409
        );
    }

    // Earn one reward per five completed, undiscounted bookings.
    $earnedQuery = $conn->prepare(
        "SELECT COUNT(DISTINCT b.BookingID) AS total
         FROM bookings b
         JOIN paymentstatus p ON p.BookingID=b.BookingID
         WHERE b.CustomerID=?
           AND b.BookingStatus='Completed'
           AND p.DiscountApplied=0"
    );
    $earnedQuery->bind_param('i', $cid);
    $earnedQuery->execute();

    $completedCount = (int)$earnedQuery
        ->get_result()
        ->fetch_assoc()['total'];

    $earnedRewards = intdiv($completedCount, 5);

    // A cancelled discounted booking releases its reward.
    $usedQuery = $conn->prepare(
        "SELECT COUNT(*) AS total
         FROM loyaltydiscounts l
         JOIN bookings b ON b.BookingID=l.BookingID
         WHERE l.CustomerID=?
           AND b.CustomerID=?
           AND l.EligibilityStatus='Used'
           AND COALESCE(b.BookingStatus, '') <> 'Cancelled'"
    );
    $usedQuery->bind_param('ii', $cid, $cid);
    $usedQuery->execute();

    $usedRewards = (int)$usedQuery
        ->get_result()
        ->fetch_assoc()['total'];

    $hasReward = $earnedRewards > $usedRewards;

    // Read and validate the database price.
    $price = (string)$service['Price'];

    if (!preg_match('/^\d+(?:\.\d{1,2})?$/', $price)) {
        throw new RuntimeException(
            'This service has an invalid price. Contact the salon.',
            409
        );
    }

    // Calculate in integer cents; round a 10% discount to the nearest cent.
    $priceParts = explode('.', $price, 2);

    $baseCents = ((int)$priceParts[0] * 100) +
        (int)str_pad($priceParts[1] ?? '', 2, '0');

    $discountCents = $hasReward
        ? intdiv($baseCents + 5, 10)
        : 0;

    $finalCents = $baseCents - $discountCents;

    $baseAmount = number_format($baseCents / 100, 2, '.', '');
    $discountAmount = number_format($discountCents / 100, 2, '.', '');
    $amount = number_format($finalCents / 100, 2, '.', '');

    $status = 'Confirmed';

    $booking = $conn->prepare(
        "INSERT INTO bookings
         (CustomerID,ServiceID,BookingDate,BookingTime,
          BookingStatus,BookingAmount)
         VALUES(?,?,?,?,?,?)"
    );
    $booking->bind_param(
        'iissss',
        $cid,
        $sid,
        $date,
        $time,
        $status,
        $amount
    );
    $booking->execute();

    $bid = $conn->insert_id;

    $message = 'Your booking for ' . $service['ServiceName'] .
        ' on ' . $date . ' at ' . $time .
        ' is confirmed. Total: R' . $amount . '.';

    if ($hasReward) {
        $message .= ' Your 10% loyalty discount has been applied.';
    }

    $notification = $conn->prepare(
        "INSERT INTO notifications(CustomerID,BookingID,Message)
         VALUES(?,?,?)"
    );
    $notification->bind_param('iis', $cid, $bid, $message);
    $notification->execute();

    $payment = $conn->prepare(
        "INSERT INTO paymentstatus
         (BookingID,AmountDue,DiscountApplied,FinalAmount)
         VALUES(?,?,?,?)"
    );
    $payment->bind_param(
        'isss',
        $bid,
        $baseAmount,
        $discountAmount,
        $amount
    );
    $payment->execute();

    if ($hasReward) {
        $reward = $conn->prepare(
            "INSERT INTO loyaltydiscounts
             (CustomerID,BookingID,DiscountPercentage,
              EligibilityStatus,RewardDate)
             VALUES(?,?,10.00,'Used',?)"
        );

        $rewardDate = (new DateTimeImmutable('now', $timezone))
            ->format('Y-m-d');

        $reward->bind_param('iis', $cid, $bid, $rewardDate);
        $reward->execute();
    }

    $conn->commit();
    $inTransaction = false;
} catch (Throwable $error) {
    if ($inTransaction) {
        $conn->rollback();
    }

    if ($error instanceof mysqli_sql_exception) {
        error_log('Booking creation failed: ' . $error->getMessage());

        $errorStatus = $error->getCode() === 1062 ? 409 : 500;

        $errorMessage = $errorStatus === 409
            ? 'This slot is already booked. Choose another time.'
            : 'Unable to create booking. Please try again.';
    } elseif (
        $error instanceof RuntimeException &&
        in_array($error->getCode(), [400, 401, 404, 409, 503], true)
    ) {
        $errorStatus = $error->getCode();
        $errorMessage = $error->getMessage();
    } else {
        error_log('Booking creation failed: ' . $error->getMessage());
        $errorMessage = 'Unable to create booking. Please try again.';
    }
} finally {
    if ($locked) {
        try {
            $conn->query(
                "SELECT RELEASE_LOCK('selectcutz_booking_create')"
            );
        } catch (Throwable $releaseError) {
            error_log(
                'Booking lock release failed: ' .
                $releaseError->getMessage()
            );
            $conn->close();
        }
    }
}

if ($errorMessage !== null) {
    json_error($errorMessage, $errorStatus);
}

json_ok([
    'message' => $message,
    'bookingId' => $bid,
    'discountApplied' => $discountAmount,
    'finalAmount' => $amount
]);
