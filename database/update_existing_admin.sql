-- Run this once in phpMyAdmin when the selectcutz database already exists.
-- It replaces the temporary seeded administrator with the approved Tshego account.
START TRANSACTION;

UPDATE admins
SET FullName = 'Tshego',
    Username = 'tshego@selectcutz',
    Password = '$6$FO2pWDMCbcvdIG5l$zEO8xQ/WLe9kt9mA/tyC8n2lkGOeQ2ucSkSz4x6aETPZEapnjxu5546Dot8BrHM9DS3DpcNFF.PO0BJHeK1e6/',
    Role = 'Administrator'
WHERE Username = 'admin';

INSERT INTO admins (FullName, Username, Password, Role)
SELECT 'Tshego', 'tshego@selectcutz', '$6$FO2pWDMCbcvdIG5l$zEO8xQ/WLe9kt9mA/tyC8n2lkGOeQ2ucSkSz4x6aETPZEapnjxu5546Dot8BrHM9DS3DpcNFF.PO0BJHeK1e6/', 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE Username = 'tshego@selectcutz');

DELETE FROM admins WHERE Username = 'admin';
COMMIT;
