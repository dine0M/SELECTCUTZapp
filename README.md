SELECT CUTZ - FIXED IONIC APP

WHAT IS FIXED
- Login and registration use the MySQL database through the PHP API.
- Requests stop with a clear error after 10 seconds instead of loading forever.
- Admin dashboard controls open Services, Settings and Reports instead of returning Home.
- Main navigation routes work: Home, Services, Owner, Booking, Login, Register and Dashboard.
- Dashboard and booking endpoints require a valid server login session.
- Customers must register before logging in; passwords are securely hashed.
- Images are optimized and responsive.
- A ready-to-upload hosting package can be generated.

RUN LOCALLY WITH XAMPP
1. Extract the project to exactly:
   C:\xampp\htdocs\SelectCutzApp_READY\SelectCutzApp
2. Start Apache and MySQL in XAMPP.
3. In phpMyAdmin, import database\select_cutz_db.sql for a new database.
   If the database already exists, import database\update_existing_admin.sql once.
4. Open a terminal in the SelectCutzApp folder (the folder containing package.json).
5. Run:
   npm install
   ionic serve
6. Do not run ionic init. This is already an Ionic project.

The development proxy sends /api requests to:
http://localhost/SelectCutzApp_READY/SelectCutzApp/backend/api

API CHECK
Open this while Apache and MySQL are running:
http://localhost/SelectCutzApp_READY/SelectCutzApp/backend/api/health.php

LOGIN RULES
- Admin: choose Admin and use the approved Tshego username and password.
- Customer: register first, then choose Customer and use that email and password.
- There are no default customer accounts.

PUBLISH TO A PHP/MYSQL WEB HOST
1. Run: npm run hosting
2. Open the generated hosting-package folder.
3. Update hosting-package\db.php with the live database details supplied by the host.
4. Import database\select_cutz_db.sql into the live MySQL database.
5. Upload the CONTENTS of hosting-package to public_html (or the host's public folder).
6. Confirm https://selectcutz.alwaysdata.net/home works.
7. Enable HTTPS before accepting registrations or bookings.

The production app uses /api on the same domain. The included .htaccess supports direct page refreshes on Apache. If the host is not Apache, configure its SPA fallback to index.html.

SECURITY
- Keep db.php and live database credentials private.
- Use a dedicated database user that can access only the SELECT CUTZ database.
- Change the admin password if it has been shared publicly.

OPEN AND RUN WITH ANDROID STUDIO
1. Install Android Studio with Android SDK Platform 36 and an Android emulator.
2. Keep this complete project at:
   C:\xampp\htdocs\SelectCutzApp_READY\SelectCutzApp
3. Start Apache and MySQL in XAMPP.
4. Open PowerShell in the SelectCutzApp folder and run:
   npm install
   npm run android:sync
   npm run android:open
5. Android Studio will open the android folder. Allow Gradle Sync to finish.
6. Start an Android emulator and press the green Run button.

The Android emulator is already configured to reach XAMPP at:
http://10.0.2.2/SelectCutzApp_READY/SelectCutzApp/backend/api

To use a physical Android phone instead of the emulator:
1. Connect the phone and PC to the same Wi-Fi network.
2. Run ipconfig in PowerShell and find the PC's IPv4 Address.
3. Replace 10.0.2.2 in nativeApiBaseUrl inside both environment files with that IPv4 address.
4. Run npm run android:sync again before pressing Run in Android Studio.
5. Permit Apache through Windows Firewall for private networks.

After every Ionic code change, run npm run android:sync before reopening/running Android Studio.
