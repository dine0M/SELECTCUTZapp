@'
# SELECT CUTZ — Person 2 API and Database Guide

## Technology

- Frontend: Ionic/Angular with TypeScript.
- Android: Capacitor with a Java native entry point.
- Backend: PHP with MySQLi.
- Local database: MariaDB 10.4 through XAMPP.
- Local database name: selectcutz.
- Working branch: person2-backend-security.

## Local backend setup

1. Start MySQL in XAMPP.
2. Configure backend/db.php for the local database.
3. From the project root, run:

   C:\xampp\php\php.exe -S 127.0.0.1:8081 -t backend

4. Keep that terminal running.
5. Test the API using http://127.0.0.1:8081/api.

The PHP development server is for local testing only.

The Angular development proxy and Android API address must separately point
to the running backend. Starting this server does not update those settings.

## Authentication

POST /api/auth.php accepts JSON.

Registration fields:
- action: register
- fullName
- email
- phone
- password

Login fields:
- action: login
- username
- password
- type: customer or admin

Successful login returns:
- success
- user: id, name and role
- sessionToken

Protected requests send the token in the X-Session-Token header.
Never include real session tokens in documentation or screenshots.

Passwords are stored using PHP password_hash() and checked using
password_verify(). The plaintext-password fallback was removed.
Legacy accounts with unsupported hashes require a controlled reset.

Sessions regenerate their ID at login, use strict session mode, expire after
30 minutes of inactivity, and have a maximum lifetime of eight hours.
Cookie settings include HttpOnly and SameSite=Lax; Secure is enabled when
PHP detects HTTPS.

POST /api/logout.php destroys the current session.

## API endpoints

| Endpoint | Method | Access | Purpose |
| --- | --- | --- | --- |
| /api/health.php | GET | Public | Basic API availability |
| /api/services.php | GET | Public | Available service catalogue |
| /api/settings.php | GET | Public | Public salon settings |
| /api/auth.php | POST | Public | Registration and login |
| /api/customer.php | GET | Customer | Own bookings and notifications |
| /api/booking_create.php | POST | Customer | Create appointment |
| /api/booking_cancel.php | POST | Customer | Cancel own appointment |
| /api/admin.php | POST | Admin | Reports and management actions |
| /api/site_update.php | POST | Admin | Update salon profile and images |
| /api/logout.php | POST | Current session | Log out |

Methods above describe intended client usage. Explicit method enforcement
has been added to admin.php, booking_create.php and booking_cancel.php;
the remaining endpoints still need a consistent method-enforcement review.

## Booking requests and rules

Creation fields:
- serviceId
- date: YYYY-MM-DD
- time: HH:mm

Cancellation fields:
- bookingId

Customer identity comes from the server session, not a supplied customerId.

The salon serves one customer at a time.
Appointments must be in the future, Monday to Saturday, and fit entirely
between 08:00 and 18:00 in Africa/Johannesburg time.

Overlapping appointments across all services are rejected.
Back-to-back appointments are allowed.

Booking creation uses a shared database advisory lock to serialize requests
through this endpoint. The booking, notification, payment and any loyalty
redemption are written within one transaction.

The API calculates prices from the services table.
BookingAmount records the final amount after discount.

Cancellation is limited to future confirmed appointments owned by the
customer. Cancellation, unpaid payment-status changes and notification
creation occur in one transaction. Paid records are not overwritten.

## Admin actions

Send an action field to POST /api/admin.php.

- reports: summary, service popularity and customer activity.
- allBookings: booking list with customer and service details.
- addService: name, description, price, duration, category, imageData.
- deleteService: serviceId; marks the service Unavailable.
- completeBooking: bookingId; marks a finished confirmed booking Completed.

All actions require an admin session.
Completion does not mark a payment Paid.
Repeating completion does not create another completion notification.

Revenue reports sum paymentstatus.FinalAmount where Status is Paid.
A payment-recording workflow remains outstanding.

## Loyalty rule

Each five completed, undiscounted bookings earns one 10% discount.
Available rewards apply automatically to a subsequent booking.
Discounted bookings do not earn progress towards another reward.
Cancelling a discounted booking makes its reward available again.

paymentstatus stores the original amount, discount and final amount.
loyaltydiscounts.BookingID links a used reward to its booking.

## Database structure

| Table | Primary key | Purpose and relationships |
| --- | --- | --- |
| customers | CustomerID | Customer identity and password hash |
| admins | AdminID | Administrator identity and password hash |
| services | ServiceID | Catalogue, prices, duration and availability |
| bookings | BookingID | References a customer and service |
| notifications | NotificationID | References a customer and optionally a booking |
| loyaltydiscounts | DiscountID | References a customer and optionally a redeemed booking |
| paymentstatus | PaymentStatusID | References a booking; monetary breakdown and payment status |
| reports | ReportID | References the admin associated with a report record |
| site_settings | SettingID | Single salon profile currently updated at SettingID=1 |

Existing customer deletion still cascades to related bookings.
A wider retention and normalisation review remains outstanding.
Report API reads do not currently insert report-history records.

## Migrations

Apply these once, in order, to an existing original schema:

1. 001_preserve_service_bookings.sql
2. 002_value_constraints.sql
3. 003_release_cancelled_slots.sql
4. 004_loyalty_booking.sql

The local database has already received these changes. Do not rerun them.

Migration 001 prevents deleting services referenced by bookings.
Migration 002 checks non-negative prices and booking amounts, positive
service duration, and discount percentages between zero and 100.
Migration 003 excludes cancelled bookings from exact-slot uniqueness.
Migration 004 links loyalty redemptions to bookings.

The original database/select_cutz_db.sql contains DROP DATABASE.
Do not import it over an existing database containing required data.
It also needs the migrations before the updated booking API can run.

## Sample data

The following files add fictional local demonstration data:

- database/seed_sample_accounts.sql
- database/seed_sample_activity.sql

Run the activity seed once only.
The account seed uses an unknown random-password hash.
It does not provide working sample admin credentials.

Last verified counts:
- admins: 11
- bookings: 14
- customers: 15
- loyaltydiscounts: 10
- notifications: 14
- paymentstatus: 14
- reports: 10
- services: 18
- site_settings: 1

Eight tables meet the ten-record requirement.
The single-profile settings table remains an unresolved rubric exception.
Sample activity affects local report totals and must not be treated as
real salon transactions.

## Verification performed

- Backend PHP syntax checks passed at the recorded checkpoints.
- Updated Angular application built successfully.
- Capacitor Android synchronization succeeded.
- Health endpoint returned success.
- Services endpoint returned eight available services before sample seeding.
- Unauthenticated admin report request returned HTTP 401.
- Customer registration succeeded.
- Customer login succeeded.
- Customer session accessed own bookings and notifications successfully.
- Customer session requesting admin reports returned HTTP 401.
- Updated database record counts were checked.

Syntax and build checks do not establish functional correctness.

## Outstanding work

- Hosted PHP API and database: deferred.
- Actual production HTTPS API URL: not configured.
- Final Android network configuration and merged release-manifest check.
- Live database credentials stored outside version control.
- Final normalisation and database-constraint review.
- Resolve the site_settings ten-record requirement.
- Controlled administrator password reset and admin login verification.
- Consistent request-method enforcement and further input validation.
- Login-attempt limiting and CSRF review for cookie-authenticated requests.
- Payment-recording workflow.
- Functional tests for booking overlap, simultaneous requests, cancellation,
  completion, loyalty calculation, logout and session expiry.
- Record appointment duration on the booking so later service-duration
  changes cannot alter existing appointment intervals.
- Final end-to-end Android testing.
- Commit and push reviewed changes.

## Hosting and Android status

Hosting has been deferred; no hosted deployment is claimed.

A release-specific Android manifest sets usesCleartextTraffic=false.
The current main manifest and Capacitor configuration retain development
HTTP settings. Both environment files still use a local HTTP API address.

Before release, configure the hosted HTTPS address, review CORS for the
actual app origin, rebuild, synchronize and verify the merged manifest.

Build and sync from the project root:

    npm run build
    npx cap sync android

Open the android folder in Android Studio to run the native application.
'@ | Set-Content -Encoding utf8 PERSON_2_API_DATABASE.md
