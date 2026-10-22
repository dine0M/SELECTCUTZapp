<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (
    $origin !== '' &&
    preg_match(
        '#^(https?://(localhost|127\.0\.0\.1)(:\d+)?|capacitor://localhost|ionic://localhost)$#',
        $origin
    )
) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Session-Token');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_ok($data = [])
{
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

function json_error($message, $status = 400)
{
    http_response_code($status);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

// Reject client-supplied session IDs that have not been initialised.
ini_set('session.use_strict_mode', '1');
ini_set('session.use_trans_sid', '0');

$sessionToken = $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';

if ($sessionToken !== '') {
    if (!preg_match('/^[A-Za-z0-9,-]{16,128}$/', $sessionToken)) {
        json_error('Invalid session token. Please log in again.', 401);
    }

    session_id($sessionToken);
}

$isHttps = !empty($_SERVER['HTTPS']) &&
    strtolower((string)$_SERVER['HTTPS']) !== 'off';

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax'
]);

if (!session_start()) {
    json_error('Unable to start session. Please try again.', 500);
}

$now = time();
$authenticated = isset($_SESSION['admin_id']) ||
    isset($_SESSION['customer_id']);

if ($authenticated) {
    $createdAt = (int)($_SESSION['created_at'] ?? 0);
    $lastActivity = (int)($_SESSION['last_activity'] ?? 0);

    if (
        $createdAt < 1 ||
        $lastActivity < 1 ||
        ($now - $lastActivity) >= 1800 ||
        ($now - $createdAt) >= 28800
    ) {
        $_SESSION = [];
        session_destroy();

        json_error('Your session has expired. Please log in again.', 401);
    }

    $_SESSION['last_activity'] = $now;
}

function input_json()
{
    $raw = file_get_contents('php://input');

    if ($raw === false) {
        json_error('Unable to read request.');
    }

    if (trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);

    if (
        json_last_error() !== JSON_ERROR_NONE ||
        !is_array($data) ||
        substr(ltrim($raw), 0, 1) !== '{'
    ) {
        json_error('Request body must be a valid JSON object.');
    }

    return $data;
}

function require_admin()
{
    $id = (int)($_SESSION['admin_id'] ?? 0);

    if ($id < 1) {
        json_error('Please log in as an administrator.', 401);
    }

    return $id;
}

function require_customer()
{
    $id = (int)($_SESSION['customer_id'] ?? 0);

    if ($id < 1) {
        json_error('Please log in as a customer.', 401);
    }

    return $id;
}

function save_uploaded_image($dataUrl, $originalName, $prefix)
{
    if (
        !is_string($dataUrl) ||
        strlen($dataUrl) > 7 * 1024 * 1024 ||
        !preg_match(
            '#^data:image/(jpeg|png|webp);base64,(.+)$#',
            $dataUrl,
            $matches
        )
    ) {
        return '';
    }

    $bytes = base64_decode($matches[2], true);

    if (
        $bytes === false ||
        strlen($bytes) === 0 ||
        strlen($bytes) > 5 * 1024 * 1024
    ) {
        return '';
    }

    $imageInfo = @getimagesizefromstring($bytes);

    if ($imageInfo === false) {
        return '';
    }

    $expectedMime = 'image/' . $matches[1];

    if (($imageInfo['mime'] ?? '') !== $expectedMime) {
        return '';
    }

    if (
        $imageInfo[0] < 1 ||
        $imageInfo[1] < 1 ||
        $imageInfo[0] > 6000 ||
        $imageInfo[1] > 6000
    ) {
        return '';
    }

    $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
    $directory = __DIR__ . '/uploads';

    if (
        !is_dir($directory) &&
        !mkdir($directory, 0755, true) &&
        !is_dir($directory)
    ) {
        return '';
    }

    $safePrefix = preg_replace('/[^a-zA-Z0-9_-]/', '', $prefix);

    if ($safePrefix === '') {
        $safePrefix = 'image';
    }

    $filename = $safePrefix . '-' .
        bin2hex(random_bytes(16)) . '.' . $extension;

    if (
        file_put_contents(
            $directory . '/' . $filename,
            $bytes,
            LOCK_EX
        ) === false
    ) {
        return '';
    }

    return 'uploads/' . $filename;
}
