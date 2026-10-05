<?php
require_once 'common.php'; require_once '../db.php';
require_admin();
$d=input_json(); $action=$d['action']??'';
if($action==='reports'){
 $out=['summary'=>['TotalCustomers'=>0,'TotalBookings'=>0,'TotalServices'=>0,'TotalRevenue'=>0],'popularServices'=>[],'customerActivity'=>[]];
 foreach([['TotalCustomers',"SELECT COUNT(*) t FROM customers"],['TotalBookings',"SELECT COUNT(*) t FROM bookings"],['TotalServices',"SELECT COUNT(*) t FROM services"],['TotalRevenue',"SELECT IFNULL(SUM(BookingAmount),0) t FROM bookings WHERE BookingStatus!='Cancelled'"]] as $q){$r=$conn->query($q[1]); if($r)$out['summary'][$q[0]]=$r->fetch_assoc()['t'];}
 $r=$conn->query("SELECT s.ServiceName,COUNT(b.BookingID) TotalBookings,IFNULL(SUM(CASE WHEN b.BookingStatus!='Cancelled' THEN b.BookingAmount ELSE 0 END),0) Revenue FROM services s LEFT JOIN bookings b ON s.ServiceID=b.ServiceID GROUP BY s.ServiceID ORDER BY TotalBookings DESC"); while($r&&($x=$r->fetch_assoc()))$out['popularServices'][]=$x;
 $r=$conn->query("SELECT c.FullName,c.Email,COUNT(b.BookingID) TotalBookings FROM customers c LEFT JOIN bookings b ON c.CustomerID=b.CustomerID GROUP BY c.CustomerID ORDER BY TotalBookings DESC"); while($r&&($x=$r->fetch_assoc()))$out['customerActivity'][]=$x;
 echo json_encode($out); exit;
}
if($action==='allBookings'){
 $r=$conn->query("SELECT b.BookingID,c.FullName,s.ServiceName,b.BookingDate,b.BookingTime,b.BookingStatus,b.BookingAmount FROM bookings b JOIN customers c ON b.CustomerID=c.CustomerID JOIN services s ON b.ServiceID=s.ServiceID ORDER BY b.DateCreated DESC");
 $data=[]; while($r&&($x=$r->fetch_assoc()))$data[]=$x; echo json_encode($data); exit;
}
if($action==='addService'){
 $name=trim((string)($d['name']??'')); $desc=trim((string)($d['description']??'')); $price=(float)($d['price']??0); $dur=(int)($d['duration']??0); $cat=trim((string)($d['category']??''));
 if($name===''||$price<0||$dur<1) json_error('Service name, price and duration are required.');
 $img=save_uploaded_image($d['imageData']??'', $d['imageName']??'', 'service');
 if($img==='') json_error('Please select a valid JPG, PNG or WebP service image.');
 $s=$conn->prepare("INSERT INTO services(ServiceName,Description,Price,Duration,Category,ServiceImage) VALUES(?,?,?,?,?,?)"); $s->bind_param('ssdiss',$name,$desc,$price,$dur,$cat,$img);
 if(!$s->execute())json_error('Unable to add service.',500); json_ok(['message'=>'Service added successfully.']);
}
if($action==='deleteService'){
 $id=(int)($d['serviceId']??0); if($id<1)json_error('Invalid service.');
 $s=$conn->prepare("DELETE FROM services WHERE ServiceID=?");$s->bind_param('i',$id);$s->execute();if($s->affected_rows===0)json_error('Service not found.',404);json_ok(['message'=>'Service deleted successfully.']);
}
json_error('Invalid admin action.');
?>
