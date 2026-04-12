# Test Credentials

## Demo Login (Primary)
- Username: `demo1`
- Password: `demo1`
- Name: Demo Student 1
- Login page: /login (uses "Username" field, NOT email)

## Additional Demo Accounts
- Username: `demo2`, Password: `demo2` (Demo Student 2)
- Username: `demo3`, Password: `demo3` (Demo Student 3)

## Admin Login
- URL: /admin-login
- No admin user seeded in database currently

## Recruitment Portal Credentials

### Recruitment Admin
- URL: /recruitment-admin
- Email: `admin@ceibaa.in`
- Password: `admin123`

### Recruiter Logins
- URL: /recruiter
- TCS: `hr@tcs.com` / `tcs123`
- Infosys: `hr@infosys.com` / `infosys123`
- Google India: `hr@google.com` / `google123`
- Flipkart: `hr@flipkart.com` / `flipkart123`
- Razorpay: `hr@razorpay.com` / `razorpay123`

### Seeded Student Accounts (for recruitment)
- All use password: `student123`
- `arjun@ceibaa.in` (AIR 245, JEE, IIT Bombay)
- `priya@ceibaa.in` (AIR 1200, NEET, AIIMS Delhi)
- `rahul@ceibaa.in` (AIR 5600, JEE, NIT Trichy)
- `sneha@ceibaa.in` (AIR 890, UPSC, Delhi University)
- `vikram@ceibaa.in` (AIR 15000, SSC, Anna University)
- `ananya@ceibaa.in` (AIR 3200, JEE, BITS Pilani)
- `karthik@ceibaa.in` (AIR 780, JEE, IIT Delhi)
- `meera@ceibaa.in` (AIR 4500, Banking, St. Xavier's College)

## Login Notes
- Frontend login page has TWO "Login" buttons (header nav + form submit). Use `form button[type="submit"]` for automation.
- After login, user is redirected to `/victory-lane`
- Recruiter login stores token as `recruiter_token` in localStorage
- Admin recruitment login stores token as `admin_recruitment_token` in localStorage
- Student auth uses existing Ceibaa token stored as `token` in localStorage
