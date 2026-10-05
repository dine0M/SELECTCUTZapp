<?php
require_once 'common.php'; require_once '../db.php';
$cid=require_customer();
$b=$conn->prepare("SELECT b.BookingID,b.BookingDate,b.BookingTime,b.BookingStatus,b.BookingAmount,s.ServiceName FROM bookings b JOIN services s ON b.ServiceID=s.ServiceID WHERE b.CustomerID=? ORDER BY b.DateCreated DESC");
$b->bind_param('i',$cid); $b->execute(); $br=$b->get_result(); $bookings=[]; while($row=$br->fetch_assoc()) $bookings[]=$row;
$n=$conn->prepare("SELECT Message,NotificationDate FROM notifications WHERE CustomerID=? ORDER BY NotificationDate DESC"); $n->bind_param('i',$cid); $n->execute(); $nr=$n->get_result(); $notes=[]; while($row=$nr->fetch_assoc()) $notes[]=$row;
echo json_encode(['bookings'=>$bookings,'notifications'=>$notes]);
?>
