
DROP DATABASE IF EXISTS selectcutz;
CREATE DATABASE selectcutz;
USE selectcutz;

CREATE TABLE site_settings (
    SettingID INT AUTO_INCREMENT PRIMARY KEY,
    SiteName VARCHAR(100) DEFAULT 'SELECT CUTZ',
    LogoPath VARCHAR(255) DEFAULT 'assets/logo.jpg',
    OwnerName VARCHAR(100) DEFAULT 'SELECT CUTZ Owner',
    OwnerTitle VARCHAR(100) DEFAULT 'Founder & Professional Barber',
    OwnerBio TEXT,
    OwnerPhoto VARCHAR(255) DEFAULT 'assets/uploads/owner.jpeg',
    ContactEmail VARCHAR(120) DEFAULT 'tshegofatso@gmail.com',
    ContactPhone VARCHAR(30) DEFAULT '+27 64 842 6381',
    Address VARCHAR(255) DEFAULT 'South Africa',
    BusinessHours VARCHAR(255) DEFAULT 'Mon - Sat: 08:00 - 18:00'
);

CREATE TABLE customers (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PhoneNumber VARCHAR(20) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    AdminID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(50) DEFAULT 'Administrator',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    ServiceID INT AUTO_INCREMENT PRIMARY KEY,
    ServiceName VARCHAR(100) NOT NULL,
    Description TEXT,
    Price DECIMAL(10,2) NOT NULL,
    Duration INT NOT NULL,
    Category VARCHAR(50),
    ServiceImage VARCHAR(255),
    AvailabilityStatus VARCHAR(20) DEFAULT 'Available'
);

CREATE TABLE bookings (
    BookingID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    ServiceID INT NOT NULL,
    BookingDate DATE NOT NULL,
    BookingTime TIME NOT NULL,
    BookingStatus VARCHAR(30) DEFAULT 'Confirmed',
    BookingAmount DECIMAL(10,2) NOT NULL,
    DateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES customers(CustomerID) ON DELETE CASCADE,
    FOREIGN KEY (ServiceID) REFERENCES services(ServiceID) ON DELETE CASCADE,
    UNIQUE KEY unique_booking_slot (ServiceID, BookingDate, BookingTime)
);

CREATE TABLE notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    BookingID INT NULL,
    Message VARCHAR(255) NOT NULL,
    NotificationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NotificationStatus VARCHAR(30) DEFAULT 'Unread',
    FOREIGN KEY (CustomerID) REFERENCES customers(CustomerID) ON DELETE CASCADE,
    FOREIGN KEY (BookingID) REFERENCES bookings(BookingID) ON DELETE SET NULL
);

CREATE TABLE loyaltydiscounts (
    DiscountID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    DiscountPercentage DECIMAL(5,2) DEFAULT 0.00,
    EligibilityStatus VARCHAR(30) DEFAULT 'Not Qualified',
    RewardDate DATE NULL,
    ExpiryDate DATE NULL,
    FOREIGN KEY (CustomerID) REFERENCES customers(CustomerID) ON DELETE CASCADE
);

CREATE TABLE paymentstatus (
    PaymentStatusID INT AUTO_INCREMENT PRIMARY KEY,
    BookingID INT NOT NULL,
    AmountDue DECIMAL(10,2) NOT NULL,
    DiscountApplied DECIMAL(10,2) DEFAULT 0.00,
    FinalAmount DECIMAL(10,2) NOT NULL,
    Status VARCHAR(30) DEFAULT 'Pay at Salon',
    FOREIGN KEY (BookingID) REFERENCES bookings(BookingID) ON DELETE CASCADE
);

CREATE TABLE reports (
    ReportID INT AUTO_INCREMENT PRIMARY KEY,
    AdminID INT NOT NULL,
    ReportType VARCHAR(50) NOT NULL,
    DateRangeStart DATE NULL,
    DateRangeEnd DATE NULL,
    GeneratedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AdminID) REFERENCES admins(AdminID) ON DELETE CASCADE
);

INSERT INTO site_settings (OwnerBio)
VALUES ('SELECT CUTZ focuses on modern grooming, professional service, clean styles, punctual bookings, and customer satisfaction.');

INSERT INTO admins (FullName, Username, Password, Role)
VALUES ('Tshego', 'tshego@selectcutz', '$6$FO2pWDMCbcvdIG5l$zEO8xQ/WLe9kt9mA/tyC8n2lkGOeQ2ucSkSz4x6aETPZEapnjxu5546Dot8BrHM9DS3DpcNFF.PO0BJHeK1e6/', 'Administrator');

INSERT INTO services (ServiceName, Description, Price, Duration, Category, ServiceImage)
VALUES
('Classic Fade', 'Modern fade haircut with sharp finishing and clean styling.', 150.00, 30, 'Haircut', 'assets/uploads/haircut1.jpeg'),
('Wave Cut', 'Premium wave hairstyle with precision fade and styling.', 180.00, 35, 'Haircut', 'assets/uploads/haircut2.jpeg'),
('Low Fade', 'Professional low fade haircut suitable for all occasions.', 160.00, 30, 'Haircut', 'assets/uploads/haircut3.jpeg'),
('Executive Cut', 'Sharp executive hairstyle with premium grooming finish.', 200.00, 45, 'Haircut', 'assets/uploads/haircut4.jpeg'),
('Beard Trim', 'Professional beard shaping and trim.', 80.00, 20, 'Grooming', 'assets/uploads/haircut1.jpeg'),
('Hair Wash', 'Hair wash and scalp treatment.', 70.00, 20, 'Treatment', 'assets/uploads/haircut2.jpeg');
