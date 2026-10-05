<?php
require_once 'common.php'; require_once '../db.php';
$d=input_json(); $cid=require_customer(); $sid=(int)($d['serviceId']??0);
$date=trim((string)($d['date']??'')); $time=trim((string)($d['time']??''));
if($cid<1||$sid<1||$date===''||$time==='') json_error('Service, date and time are required.');
$cu=$conn->prepare("SELECT CustomerID FROM customers WHERE CustomerID=? LIMIT 1"); $cu->bind_param('i',$cid); $cu->execute(); if(!$cu->get_result()->fetch_assoc()) json_error('Customer account was not found.',401);
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||!preg_match('/^\d{2}:\d{2}$/',$time)) json_error('Invalid date or time.');
$sv=$conn->prepare("SELECT Price,ServiceName FROM services WHERE ServiceID=? AND AvailabilityStatus='Available'");
$sv->bind_param('i',$sid); $sv->execute(); $service=$sv->get_result()->fetch_assoc();
if(!$service) json_error('Selected service was not found.',404);
$chk=$conn->prepare("SELECT BookingID FROM bookings WHERE ServiceID=? AND BookingDate=? AND BookingTime=? AND BookingStatus!='Cancelled' LIMIT 1");
$chk->bind_param('iss',$sid,$date,$time); $chk->execute(); $chk->store_result();
if($chk->num_rows>0) json_error('This time slot is already booked. Please choose another time.');
$amount=(float)$service['Price']; $status='Confirmed';
$b=$conn->prepare("INSERT INTO bookings(CustomerID,ServiceID,BookingDate,BookingTime,BookingStatus,BookingAmount) VALUES(?,?,?,?,?,?)");
$b->bind_param('iisssd',$cid,$sid,$date,$time,$status,$amount);
if(!$b->execute()) json_error('Booking failed. Please try again.',500);
$bid=$conn->insert_id;
$msg="Your booking for ".$service['ServiceName']." on ".$date." at ".$time." is confirmed.";
$n=$conn->prepare("INSERT INTO notifications(CustomerID,BookingID,Message) VALUES(?,?,?)"); $n->bind_param('iis',$cid,$bid,$msg); $n->execute();
$p=$conn->prepare("INSERT INTO paymentstatus(BookingID,AmountDue,FinalAmount) VALUES(?,?,?)"); $p->bind_param('idd',$bid,$amount,$amount); $p->execute();
json_ok(['message'=>$msg,'bookingId'=>$bid]);
?>
