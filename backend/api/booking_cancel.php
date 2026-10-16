<?php
require_once 'common.php';
require_once '../db.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    json_error('Use POST for booking cancellation.', 405);
}

$cid = require_customer();
$d = input_json();

$bid = filter_var(
    $d['bookingId'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);

if ($bid === false) {
    json_error('Invalid booking.');
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn->begin_transaction();

    $s = $conn->prepare(
        "SELECT BookingStatus, BookingDate, BookingTime
         FROM bookings
         WHERE BookingID=? AND CustomerID=?
         FOR UPDATE"
    );
    $s->bind_param('ii', $bid, $cid);
    $s->execute();
    $booking = $s->get_result()->fetch_assoc();

    if (!$booking) {
        $conn->rollback();
        json_error('Booking was not found.', 404);
    }

    if ($booking['BookingStatus'] !== 'Confirmed') {
        $conn->rollback();
        json_error('Only confirmed bookings can be cancelled.', 409);
    }

    $timezone = new DateTimeZone('Africa/Johannesburg');
    $appointment = new DateTimeImmutable(
        $booking['BookingDate'] . ' ' . $booking['BookingTime'],
        $timezone
    );

    if ($appointment <= new DateTimeImmutable('now', $timezone)) {
        $conn->rollback();
        json_error('Past appointments cannot be cancelled.', 409);
    }

    $s = $conn->prepare(
        "UPDATE bookings
         SET BookingStatus='Cancelled'
         WHERE BookingID=? AND CustomerID=?"
    );
    $s->bind_param('ii', $bid, $cid);
    $s->execute();

    // Cancel unpaid amounts without overwriting paid payment records.
    $p = $conn->prepare(
        "UPDATE paymentstatus
         SET Status='Cancelled'
         WHERE BookingID=? AND Status='Pay at Salon'"
    );
    $p->bind_param('i', $bid);
    $p->execute();

    $message = 'Your appointment has been cancelled.';

    $n = $conn->prepare(
        "INSERT INTO notifications(CustomerID,BookingID,Message)
         VALUES(?,?,?)"
    );
    $n->bind_param('iis', $cid, $bid, $message);
    $n->execute();

    $conn->commit();

    json_ok(['message' => 'Booking cancelled successfully.']);
} catch (Throwable $error) {
    $conn->rollback();
    error_log('Booking cancellation failed: ' . $error->getMessage());
    json_error('Unable to cancel booking. Please try again.', 500);
}
