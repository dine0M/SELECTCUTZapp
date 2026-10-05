<?php
require_once 'common.php'; require_once '../db.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
$r = $conn->query("SELECT ServiceID,ServiceName,Description,Price,Duration,Category,ServiceImage,AvailabilityStatus FROM services WHERE AvailabilityStatus='Available' OR AvailabilityStatus IS NULL OR AvailabilityStatus='' ORDER BY ServiceID");
if (!$r) json_error('Unable to load services.', 500);
$data=[]; while($row=$r->fetch_assoc()) $data[]=$row;
echo json_encode($data);
?>
