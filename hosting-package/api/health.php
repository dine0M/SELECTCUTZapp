<?php
require_once 'common.php';
require_once '../db.php';

$result = $conn->query('SELECT 1');
if (!$result) json_error('Database connection failed.', 500);
json_ok(['message' => 'SELECT CUTZ API is running.']);
?>
