<?php
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../db.php';

$cid = require_customer();
$method = $_SERVER['REQUEST_METHOD'] ?? '';

if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    json_error('Use GET or POST for customer settings.', 405);
}

// Changes require the app's session header, not just a cookie.
if ($method === 'POST') {
    $token = $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';

    if ($token === '' || !hash_equals(session_id(), $token)) {
        json_error('Please log in again before changing settings.', 401);
    }
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $query = $conn->prepare(
        "SELECT CustomerID, FullName, Email, PhoneNumber, Password
         FROM customers
         WHERE CustomerID=?"
    );
    $query->bind_param('i', $cid);
    $query->execute();
    $customer = $query->get_result()->fetch_assoc();

    if (!$customer) {
        json_error('Customer account not found.', 401);
    }

    if ($method === 'GET') {
        json_ok([
            'profile' => [
                'id' => (int)$customer['CustomerID'],
                'fullName' => $customer['FullName'],
                'email' => $customer['Email'],
                'phone' => $customer['PhoneNumber']
            ]
        ]);
    }

    $data = input_json();
    $action = $data['action'] ?? '';

    if ($action === 'updateProfile') {
        $name = $data['fullName'] ?? null;
        $phone = $data['phone'] ?? null;

        if (!is_string($name) || !is_string($phone)) {
            json_error('Name and phone number are required.');
        }

        $name = trim($name);
        $phone = trim($phone);

        if ($name === '' || strlen($name) > 100) {
            json_error('Enter a name of no more than 100 bytes.');
        }

        if (
            strlen($phone) > 20 ||
            !preg_match('/^\+?[0-9 ()-]{7,20}$/', $phone)
        ) {
            json_error('Enter a valid phone number.');
        }

        $update = $conn->prepare(
            "UPDATE customers
             SET FullName=?, PhoneNumber=?
             WHERE CustomerID=?"
        );
        $update->bind_param('ssi', $name, $phone, $cid);
        $update->execute();

        $_SESSION['name'] = $name;

        json_ok([
            'message' => 'Your profile has been updated.',
            'profile' => [
                'id' => $cid,
                'fullName' => $name,
                'email' => $customer['Email'],
                'phone' => $phone
            ]
        ]);
    }

    if ($action === 'changePassword') {
        $current = $data['currentPassword'] ?? null;
        $new = $data['newPassword'] ?? null;

        if (!is_string($current) || !is_string($new)) {
            json_error('Enter your current and new passwords.');
        }

        if (!password_verify($current, $customer['Password'])) {
            json_error('Your current password is incorrect.', 400);
        }

        if (
            strlen($new) < 12 ||
            strlen($new) > 72 ||
            strpos($new, "\0") !== false
        ) {
            json_error('Use a new password between 12 and 72 bytes.');
        }

        if (password_verify($new, $customer['Password'])) {
            json_error('Choose a password different from your current one.');
        }

        $hash = password_hash($new, PASSWORD_DEFAULT);

        // Avoid overwriting a password changed by another request.
        $oldHash = $customer['Password'];
        $update = $conn->prepare(
            "UPDATE customers
             SET Password=?
             WHERE CustomerID=? AND Password=?"
        );
        $update->bind_param('sis', $hash, $cid, $oldHash);
        $update->execute();

        if ($update->affected_rows !== 1) {
            json_error('Account changed. Please log in again and retry.', 409);
        }

        // End this session after changing its password.
        $_SESSION = [];
        session_destroy();

        json_ok([
            'message' => 'Password changed. Please log in again.',
            'requiresLogin' => true
        ]);
    }

    json_error('Invalid profile action.');
} catch (Throwable $error) {
    error_log('Customer settings failed: ' . $error->getMessage());
    json_error('Unable to process customer settings. Please try again.', 500);
}
