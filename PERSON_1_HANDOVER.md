# Person 1 Handover

## Completed

- Login and registration validate on the first button press and always stop their loading state.
- Login and registration API requests now stop with a clear connection message after six seconds.
- The admin dashboard and all admin pages scroll correctly.
- The administrator menu contains Dashboard, Manage Services, Logo & Owner, Reports, and Logout.
- Admin tools remain hidden from customer users.
- Booking validates service, date, and time before submission.
- A successful booking opens a dedicated confirmation page with the booking details.
- The Angular project compiles successfully and its web files have been synchronized to Android.

## Before testing on a physical phone

1. Start Apache and MySQL in XAMPP.
2. Confirm the database has been imported and the API works in PowerShell.
3. Set `nativeApiBaseUrl` in both environment files to the computer's current IPv4 address.
4. Run `npm install`, `npm run build`, and `npx cap sync android` from the SelectCutzApp folder.
5. Open the `android` folder in Android Studio and run the app on the connected phone.

## Handover note

API/database correctness, production hosting, and final end-to-end testing still require the team members responsible for backend, integration, and deployment. The Person 1 interface and navigation work is complete once the checklist above passes on the target phone.
