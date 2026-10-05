<?php
require_once 'common.php'; require_once '../db.php';
$d=input_json(); $cid=require_customer(); $bid=(int)($d['bookingId']??0);
if($cid<1||$bid<1) json_error('Invalid booking.');
$s=$conn->prepare("UPDATE bookings SET BookingStatus='Cancelled' WHERE BookingID=? AND CustomerID=? AND BookingStatus!='Cancelled'");
$s->bind_param('ii',$bid,$cid); $s->execute();
if($s->affected_rows===0) json_error('Booking was not found or is already cancelled.',404);
json_ok(['message'=>'Booking cancelled successfully.']);
?>
