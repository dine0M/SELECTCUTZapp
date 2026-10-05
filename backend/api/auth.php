<?php
require_once 'common.php'; require_once '../db.php';
$d=input_json(); $action=$d['action'] ?? '';
if($action==='register'){
    $name=trim((string)($d['fullName'] ?? '')); $email=strtolower(trim((string)($d['email'] ?? '')));
    $phone=trim((string)($d['phone'] ?? '')); $pass=(string)($d['password'] ?? '');
    if($name==='' || !filter_var($email,FILTER_VALIDATE_EMAIL) || $phone==='' || strlen($pass)<6) json_error('Please provide a valid name, email, phone number and a password of at least 6 characters.');
    $c=$conn->prepare("SELECT CustomerID FROM customers WHERE Email=?"); $c->bind_param('s',$email); $c->execute(); $c->store_result();
    if($c->num_rows>0) json_error('Email already registered. Please login.');
    $hash=password_hash($pass,PASSWORD_DEFAULT);
    $s=$conn->prepare("INSERT INTO customers(FullName,Email,PhoneNumber,Password) VALUES(?,?,?,?)");
    $s->bind_param('ssss',$name,$email,$phone,$hash);
    if(!$s->execute()) json_error('Registration failed. Please try again.',500);
    json_ok(['message'=>'Account created successfully.']);
}
if($action==='login'){
    $username=strtolower(trim((string)($d['username'] ?? ''))); $pass=(string)($d['password'] ?? '');
    $type=($d['type'] ?? 'customer')==='admin'?'admin':'customer';
    if($username==='' || $pass==='') json_error('Please enter your login details.');
    if($type==='admin'){
        $s=$conn->prepare("SELECT AdminID,FullName,Username,Password,Role FROM admins WHERE LOWER(Username)=? LIMIT 1");
    } else {
        $s=$conn->prepare("SELECT CustomerID,FullName,Email,Password FROM customers WHERE LOWER(Email)=? LIMIT 1");
    }
    $s->bind_param('s',$username); $s->execute(); $r=$s->get_result(); $row=$r->fetch_assoc();
    if(!$row) json_error('Invalid login. Please check the account type, email/username, and password.',401);
    $valid=password_verify($pass,$row['Password']);
    // Keep existing legacy accounts working; upgrade their stored password after a successful login.
    if(!$valid && hash_equals((string)$row['Password'],$pass)){
        $hash=password_hash($pass,PASSWORD_DEFAULT);
        if($type==='admin'){ $u=$conn->prepare("UPDATE admins SET Password=? WHERE AdminID=?"); $u->bind_param('si',$hash,$row['AdminID']); }
        else { $u=$conn->prepare("UPDATE customers SET Password=? WHERE CustomerID=?"); $u->bind_param('si',$hash,$row['CustomerID']); }
        $u->execute(); $valid=true;
    }
    if(!$valid) json_error('Invalid login. Please check the account type, email/username, and password.',401);
    $id=$type==='admin'?(int)$row['AdminID']:(int)$row['CustomerID'];
    session_regenerate_id(true);
    unset($_SESSION['admin_id'], $_SESSION['customer_id']);
    $_SESSION[$type === 'admin' ? 'admin_id' : 'customer_id'] = $id;
    $_SESSION['name'] = $row['FullName'];
    json_ok(['user'=>['id'=>$id,'name'=>$row['FullName'],'role'=>$type], 'sessionToken'=>session_id()]);
}
json_error('Invalid action.');
?>
