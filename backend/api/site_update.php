<?php
require_once 'common.php'; require_once '../db.php';
require_admin();
$d=input_json();
$fields=['SiteName','OwnerName','OwnerTitle','OwnerBio','ContactPhone','ContactEmail','BusinessHours','Address'];
$vals=[]; foreach($fields as $f){$vals[] = trim((string)($d[$f]??''));}
if($vals[0]==='') json_error('Website name is required.');
$s=$conn->prepare("UPDATE site_settings SET SiteName=?,OwnerName=?,OwnerTitle=?,OwnerBio=?,ContactPhone=?,ContactEmail=?,BusinessHours=?,Address=? WHERE SettingID=1");
[$siteName,$ownerName,$ownerTitle,$ownerBio,$phone,$email,$hours,$address] = $vals;
$s->bind_param('ssssssss',$siteName,$ownerName,$ownerTitle,$ownerBio,$phone,$email,$hours,$address);
if(!$s->execute()) json_error('Unable to update site details.',500);
$logo=save_uploaded_image($d['logoData']??'', $d['logoName']??'', 'logo');
$owner=save_uploaded_image($d['ownerData']??'', $d['ownerImageName']??'', 'owner');
if($logo!==''){ $u=$conn->prepare("UPDATE site_settings SET LogoPath=? WHERE SettingID=1"); $u->bind_param('s',$logo); $u->execute(); }
if($owner!==''){ $u=$conn->prepare("UPDATE site_settings SET OwnerPhoto=? WHERE SettingID=1"); $u->bind_param('s',$owner); $u->execute(); }
json_ok(['message'=>'Website details updated successfully.']);
?>
