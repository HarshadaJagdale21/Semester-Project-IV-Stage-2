# Smart Campus — Academic Resource Portal

A centralized web portal for **R. C. Patel Institute of Technology (RCPIT), Shirpur**
where the **admin** uploads official syllabus copies and subject notes (as PDFs), and
**students** register, log in, and browse/download exactly what applies to their
branch, year and semester.

Built as a real, runnable full-stack project — not a static mockup.

---

## 1. Features

**Student**
- Registration (name, email, password, enrollment no., branch, year, semester)
- Secure login (passwords are hashed, never stored in plain text)
- Personal dashboard showing resource counts for their own branch/semester
- Browse & filter Syllabus and Notes by branch / year / semester / subject / search
- Download PDFs directly

**Admin** (separate login at `/admin/login`)
- Upload Syllabus / Notes PDFs with full metadata (branch, year, semester, subject)
- Manage (view/delete) all uploaded files
- View and search all registered students
- Activate / deactivate student accounts
- Dashboard with live stats (students, files, downloads)

**Security**
- Passwords hashed with Werkzeug's `generate_password_hash`
- Session-based authentication with role checks on every protected route
- Students cannot access any `/admin/*` route (redirected + "Unauthorized" message)
- Admin accounts can only be created via the `seed_admin.py` script — never through
  a public form
- File uploads are restricted to `.pdf`, max 25 MB, and stored under a randomized
  filename (the original name is preserved only for display/download)

---

## 2. Technology Stack

- **Backend:** Python, Flask
- **Database:** SQLite (built into Python — no separate database server to install)
- **Frontend:** Server-rendered Jinja2 templates + Tailwind CSS (via CDN)
- **Auth:** Flask sessions + Werkzeug password hashing

This is intentionally simpler than a React+MongoDB stack so that **you can run the
whole project with just Python installed** — ideal for a college demo where you may
not have admin rights to install a database server.

---

## 3. Project Structure

```
SmartCampus/
├── app.py                 # Main Flask application (routes, auth, DB logic)
├── seed_admin.py           # One-time script to create the first admin account
├── requirements.txt
├── .env.example             # Copy to .env and fill in your own secret key
├── .gitignore
├── smartcampus.db           # Created automatically on first run (SQLite database)
├── static/
│   ├── css/
│   └── uploads/
│       ├── syllabus/        # Uploaded syllabus PDFs land here
│       └── notes/           # Uploaded notes PDFs land here
└── templates/
    ├── base.html            # Shared layout, nav, flash messages
    ├── index.html           # Public landing page
    ├── register.html        # Student registration
    ├── login.html            # Student login
    ├── admin_login.html      # Admin login (separate page)
    ├── student_dashboard.html
    ├── resources.html        # Browse/filter/download syllabus or notes
    ├── admin_dashboard.html
    ├── admin_upload.html     # Admin PDF upload form
    ├── admin_manage.html     # Admin: view/delete uploaded files
    ├── admin_students.html   # Admin: view/search/(de)activate students
    └── error.html
```

---

## 4. Installation & Setup

### Step 1 — Install Python dependencies

```bash
cd SmartCampus
python3 -m venv venv
source venv/bin/activate          # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set:
- `SECRET_KEY` — any long random string (used to sign session cookies)
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used only once, by the seed script below

### Step 3 — Create the database and the first Admin account

```bash
python seed_admin.py
```

This creates `smartcampus.db` and one admin account. If you leave the `ADMIN_*`
variables blank in `.env`, the script will simply ask you for them interactively.

### Step 4 — Run the application

```bash
python app.py
```

Visit **http://127.0.0.1:5000** in your browser.

---

## 5. How to Use / Demo Script

1. **Student registration:** Go to `/register`, sign up with a branch/year/semester.
2. **Student login:** Go to `/login` and sign in — you land on your dashboard.
3. **Admin login:** Go to `/admin/login` and sign in with the account you created
   in Step 3 above.
4. **Upload a resource:** As admin, go to **Upload** → choose Syllabus or Notes →
   fill in branch/year/semester/subject → attach a PDF → Upload.
5. **See it as a student:** Log out, log back in as the student, go to **Syllabus**
   or **Notes**, filter by the same branch/semester — the file appears with a
   Download button.
6. **Manage files:** As admin, go to **Manage Files** to see every upload and delete
   any of them.
7. **Manage students:** As admin, go to **Students** to search students or
   deactivate/reactivate an account (a deactivated student is blocked at login).

---

## 6. Populating Real College Data

The branch list in `app.py` (`BRANCHES` constant) is pre-filled with RCPIT's real
departments (Computer Engineering, IT, ECE, Electrical, Mechanical, Civil, CSE-Data
Science, and First-Year Applied Sciences). Edit that list directly in `app.py` if a
department name needs correcting, then upload your college's actual syllabus and
notes PDFs through the Admin → Upload page — there is no fake/sample data seeded
into the database, so everything you see after setup is real data you uploaded.

---

## 7. Notes on Scope

This build focuses on the part you asked for — secure login for both roles, and an
admin-controlled pipeline for uploading/organizing syllabus & notes PDFs that
students can browse and download. It does **not** include the AI agents (study
planner, doubt solver, test generator), aptitude testing, or MongoDB/React layers
described in a larger project brief — those are a substantially bigger build (weeks
of additional work: LLM integration, RAG pipeline, a separate React frontend, etc.).
If you'd like any of those added next, they can be layered on top of this working
foundation one at a time.

---

## 8. Troubleshooting

- **"ModuleNotFoundError: No module named 'flask'"** — activate your virtual
  environment and re-run `pip install -r requirements.txt`.
- **Port 5000 already in use** — stop whatever is using it, or change
  `app.run(debug=True, port=5000)` at the bottom of `app.py` to another port.
- **Uploaded file doesn't show up for a student** — double check the branch, year,
  and semester you selected during upload match exactly what the student registered
  with (filters are exact matches).
- **Forgot the admin password** — delete `smartcampus.db`... but that also deletes
  all student accounts and uploads, so instead just run `seed_admin.py` again with
  a *new* admin email to create a second admin account.
