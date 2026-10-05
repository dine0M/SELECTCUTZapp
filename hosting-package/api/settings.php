<?php
require_once 'common.php'; require_once '../db.php';
$s=get_settings($conn);
echo json_encode([
 'SiteName'=>$s['SiteName'] ?? 'SELECT CUTZ','LogoPath'=>$s['LogoPath'] ?? 'assets/uploads/logo.jpg',
 'OwnerName'=>$s['OwnerName'] ?? 'Tshego','OwnerTitle'=>$s['OwnerTitle'] ?? 'Founder & Professional Barber',
 'OwnerBio'=>$s['OwnerBio'] ?? 'SELECT CUTZ is a modern barber and salon business focused on quality grooming.',
 'OwnerPhoto'=>$s['OwnerPhoto'] ?? 'assets/uploads/owner.jpeg','ContactEmail'=>$s['ContactEmail'] ?? 'tshegofatso@gmail.com',
 'ContactPhone'=>$s['ContactPhone'] ?? '+27 64 842 6381','Address'=>$s['Address'] ?? 'South Africa',
 'BusinessHours'=>$s['BusinessHours'] ?? 'Mon - Sat: 08:00 - 18:00'
]);
?>