<?php
$host = "localhost";
$user = "root";
$password = "";
$database = "selectcutz";
try {
    $conn = mysqli_init();
    $conn->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    $conn->real_connect($host, $user, $password, $database);
} catch (mysqli_sql_exception $error) {
    http_response_code(500);
    if (str_contains($_SERVER['REQUEST_URI'] ?? '', '/api/')) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success'=>false, 'message'=>'The database is unavailable. Check that MySQL is running and the database settings are correct.']);
        exit;
    }
    die('Database connection failed.');
}
$conn->set_charset("utf8mb4");
function e($value) { return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8'); }
function get_settings($conn) {
    $result = $conn->query("SELECT * FROM site_settings LIMIT 1");
    if ($result && ($row = $result->fetch_assoc())) return $row;
    return [
        'SiteName'=>'SELECT CUTZ','LogoPath'=>'assets/logo.jpg','OwnerName'=>'Tshego',
        'OwnerTitle'=>'Founder & Professional Barber','OwnerBio'=>'SELECT CUTZ is a modern barber and salon business.',
        'OwnerPhoto'=>'assets/owner.jpeg','ContactEmail'=>'tshegofatso@gmail.com',
        'ContactPhone'=>'+27 64 842 6381','Address'=>'Container 12, 344 Francis Baard St, Pretoria Central, Pretoria, 0002, South Africa',
        'BusinessHours'=>'Mon - Sat: 08:00 - 18:00'
    ];
}
?>
