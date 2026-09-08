"""
Smart Campus - Academic Resource Portal
Real-college project for R. C. Patel Institute of Technology (RCPIT), Shirpur.

Two roles:
  - STUDENT : registers/logs in, browses & downloads syllabus/notes filtered by
              branch / year / semester / subject.
  - ADMIN   : logs in separately, uploads / edits / deletes syllabus & notes PDFs,
              and manages student accounts.

Stack: Flask + sqlite3 (built into Python, no external DB server needed) + Jinja2 + Tailwind (CDN).
Passwords are hashed with Werkzeug's generate_password_hash (never stored in plain text).
Sessions are used for auth; every sensitive route is protected with a role-check decorator.
"""

import os
import sqlite3
import uuid
from datetime import datetime
from functools import wraps

from flask import (
    Flask, render_template, request, redirect, url_for,
    session, flash, send_from_directory, abort, g
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "smartcampus.db")
UPLOAD_ROOT = os.path.join(BASE_DIR, "static", "uploads")
ALLOWED_EXTENSIONS = {"pdf"}
MAX_CONTENT_LENGTH = 25 * 1024 * 1024  # 25 MB per file

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-this-in-production")
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# ---------------------------------------------------------------------------
# College academic structure (real RCPIT departments — from rcpit.ac.in).
# Admin cannot invent new colleges, only choose branch/year/semester when uploading.
# ---------------------------------------------------------------------------
COLLEGE_NAME = "R. C. Patel Institute of Technology (RCPIT), Shirpur"
BRANCHES = [
    "Computer Engineering",
    "Computer Science & Engineering (Data Science)",
    "Information Technology",
    "Electronics & Communication Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Applied Sciences & Humanities (First Year)",
]
YEARS = ["First Year", "Second Year", "Third Year", "Final Year"]
SEMESTERS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"]


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            enrollment_no TEXT,
            branch TEXT,
            year TEXT,
            semester TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kind TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            branch TEXT NOT NULL,
            year TEXT NOT NULL,
            semester TEXT NOT NULL,
            subject TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            uploaded_by INTEGER,
            downloads INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (uploaded_by) REFERENCES users (id)
        );
        """
    )
    db.commit()
    db.close()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def login_required(role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            uid = session.get("user_id")
            if not uid:
                flash("Please log in to continue.", "error")
                return redirect(url_for("admin_login") if role == "admin" else url_for("student_login"))
            user = get_db().execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
            if not user or not user["active"]:
                session.clear()
                flash("Your session is invalid. Please log in again.", "error")
                return redirect(url_for("student_login"))
            if role and user["role"] != role:
                flash("Unauthorized access.", "error")
                return redirect(url_for("student_dashboard") if user["role"] == "student" else url_for("admin_dashboard"))
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return get_db().execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_dt(value):
    """SQLite stores created_at as ISO text; templates want a datetime for strftime."""
    return datetime.fromisoformat(value)


@app.context_processor
def inject_globals():
    return dict(current_user=current_user(), college_name=COLLEGE_NAME, now=datetime.utcnow())


app.jinja_env.filters["dt"] = parse_dt


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    db = get_db()
    stats = {
        "students": db.execute("SELECT COUNT(*) c FROM users WHERE role='student'").fetchone()["c"],
        "syllabus": db.execute("SELECT COUNT(*) c FROM resources WHERE kind='syllabus'").fetchone()["c"],
        "notes": db.execute("SELECT COUNT(*) c FROM resources WHERE kind='notes'").fetchone()["c"],
        "branches": len(BRANCHES),
    }
    return render_template("index.html", stats=stats)


# ---------------------------------------------------------------------------
# Student auth
# ---------------------------------------------------------------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm_password", "")
        enrollment_no = request.form.get("enrollment_no", "").strip()
        branch = request.form.get("branch")
        year = request.form.get("year")
        semester = request.form.get("semester")

        errors = []
        if not name or not email or not password:
            errors.append("Name, email and password are required.")
        if password != confirm:
            errors.append("Passwords do not match.")
        if len(password) < 6:
            errors.append("Password must be at least 6 characters.")
        if branch not in BRANCHES or year not in YEARS or semester not in SEMESTERS:
            errors.append("Please select a valid branch, year and semester.")

        db = get_db()
        if not errors and db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
            errors.append("An account with this email already exists.")

        if errors:
            for e in errors:
                flash(e, "error")
            return render_template("register.html", branches=BRANCHES, years=YEARS,
                                    semesters=SEMESTERS, form=request.form)

        password_hash = generate_password_hash(password)
        db.execute(
            """INSERT INTO users (name, email, password_hash, role, enrollment_no, branch, year, semester,
                                   active, created_at)
               VALUES (?, ?, ?, 'student', ?, ?, ?, ?, 1, ?)""",
            (name, email, password_hash, enrollment_no, branch, year, semester, datetime.utcnow().isoformat()),
        )
        db.commit()

        flash("Registration successful! Please log in.", "success")
        return redirect(url_for("student_login"))

    return render_template("register.html", branches=BRANCHES, years=YEARS, semesters=SEMESTERS, form={})


@app.route("/login", methods=["GET", "POST"])
def student_login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = get_db().execute("SELECT * FROM users WHERE email = ? AND role='student'", (email,)).fetchone()
        if not user or not check_password_hash(user["password_hash"], password):
            flash("Invalid email or password.", "error")
            return render_template("login.html")
        if not user["active"]:
            flash("Your account has been deactivated. Contact the administrator.", "error")
            return render_template("login.html")
        session.clear()
        session["user_id"] = user["id"]
        session["role"] = "student"
        flash(f"Welcome back, {user['name']}!", "success")
        return redirect(url_for("student_dashboard"))
    return render_template("login.html")


# ---------------------------------------------------------------------------
# Admin auth (separate login page, separate credential check)
# ---------------------------------------------------------------------------
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = get_db().execute("SELECT * FROM users WHERE email = ? AND role='admin'", (email,)).fetchone()
        if not user or not check_password_hash(user["password_hash"], password):
            flash("Invalid admin credentials.", "error")
            return render_template("admin_login.html")
        session.clear()
        session["user_id"] = user["id"]
        session["role"] = "admin"
        flash(f"Welcome back, {user['name']}.", "success")
        return redirect(url_for("admin_dashboard"))
    return render_template("admin_login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for("index"))


# ---------------------------------------------------------------------------
# Student area
# ---------------------------------------------------------------------------
@app.route("/dashboard")
@login_required(role="student")
def student_dashboard():
    user = current_user()
    db = get_db()
    my_branch_syllabus = db.execute(
        "SELECT COUNT(*) c FROM resources WHERE kind='syllabus' AND branch=? AND semester=?",
        (user["branch"], user["semester"]),
    ).fetchone()["c"]
    my_branch_notes = db.execute(
        "SELECT COUNT(*) c FROM resources WHERE kind='notes' AND branch=? AND semester=?",
        (user["branch"], user["semester"]),
    ).fetchone()["c"]
    recent = db.execute(
        """SELECT * FROM resources WHERE branch=? AND semester=?
           ORDER BY created_at DESC LIMIT 6""",
        (user["branch"], user["semester"]),
    ).fetchall()
    return render_template("student_dashboard.html", user=user,
                            my_branch_syllabus=my_branch_syllabus,
                            my_branch_notes=my_branch_notes, recent=recent)


@app.route("/resources")
@login_required()
def resources():
    kind = request.args.get("kind", "syllabus")
    branch = request.args.get("branch", "")
    year = request.args.get("year", "")
    semester = request.args.get("semester", "")
    q = request.args.get("q", "").strip()

    sql = "SELECT * FROM resources WHERE kind = ?"
    params = [kind]
    if branch:
        sql += " AND branch = ?"
        params.append(branch)
    if year:
        sql += " AND year = ?"
        params.append(year)
    if semester:
        sql += " AND semester = ?"
        params.append(semester)
    if q:
        sql += " AND (title LIKE ? OR subject LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like])
    sql += " ORDER BY created_at DESC"

    items = get_db().execute(sql, params).fetchall()
    return render_template("resources.html", items=items, kind=kind, branch=branch, year=year,
                            semester=semester, q=q, branches=BRANCHES, years=YEARS, semesters=SEMESTERS)


@app.route("/download/<int:resource_id>")
@login_required()
def download(resource_id):
    db = get_db()
    res = db.execute("SELECT * FROM resources WHERE id = ?", (resource_id,)).fetchone()
    if not res:
        abort(404)
    db.execute("UPDATE resources SET downloads = downloads + 1 WHERE id = ?", (resource_id,))
    db.commit()
    folder = os.path.join(UPLOAD_ROOT, res["kind"])
    return send_from_directory(folder, res["filename"], as_attachment=True,
                                download_name=res["original_name"])


# ---------------------------------------------------------------------------
# Admin area
# ---------------------------------------------------------------------------
@app.route("/admin")
@login_required(role="admin")
def admin_dashboard():
    db = get_db()
    stats = {
        "students": db.execute("SELECT COUNT(*) c FROM users WHERE role='student'").fetchone()["c"],
        "syllabus": db.execute("SELECT COUNT(*) c FROM resources WHERE kind='syllabus'").fetchone()["c"],
        "notes": db.execute("SELECT COUNT(*) c FROM resources WHERE kind='notes'").fetchone()["c"],
        "downloads": db.execute("SELECT COALESCE(SUM(downloads),0) c FROM resources").fetchone()["c"],
    }
    recent_uploads = db.execute("SELECT * FROM resources ORDER BY created_at DESC LIMIT 8").fetchall()
    recent_students = db.execute(
        "SELECT * FROM users WHERE role='student' ORDER BY created_at DESC LIMIT 8"
    ).fetchall()
    return render_template("admin_dashboard.html", stats=stats, recent_uploads=recent_uploads,
                            recent_students=recent_students)


@app.route("/admin/upload", methods=["GET", "POST"])
@login_required(role="admin")
def admin_upload():
    if request.method == "POST":
        kind = request.form.get("kind")
        title = request.form.get("title", "").strip()
        description = request.form.get("description", "").strip()
        branch = request.form.get("branch")
        year = request.form.get("year")
        semester = request.form.get("semester")
        subject = request.form.get("subject", "").strip()
        file = request.files.get("file")

        errors = []
        if kind not in ("syllabus", "notes"):
            errors.append("Invalid resource type.")
        if not title or not subject:
            errors.append("Title and subject are required.")
        if branch not in BRANCHES or year not in YEARS or semester not in SEMESTERS:
            errors.append("Please select a valid branch, year and semester.")
        if not file or file.filename == "":
            errors.append("Please choose a PDF file to upload.")
        elif not allowed_file(file.filename):
            errors.append("Only PDF files are allowed.")

        if errors:
            for e in errors:
                flash(e, "error")
            return render_template("admin_upload.html", branches=BRANCHES, years=YEARS,
                                    semesters=SEMESTERS, form=request.form)

        safe_name = secure_filename(file.filename)
        stored_name = f"{uuid.uuid4().hex}_{safe_name}"
        dest_dir = os.path.join(UPLOAD_ROOT, kind)
        os.makedirs(dest_dir, exist_ok=True)
        file.save(os.path.join(dest_dir, stored_name))

        db = get_db()
        db.execute(
            """INSERT INTO resources (kind, title, description, branch, year, semester, subject,
                                       filename, original_name, uploaded_by, downloads, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)""",
            (kind, title, description, branch, year, semester, subject, stored_name, safe_name,
             session["user_id"], datetime.utcnow().isoformat()),
        )
        db.commit()
        flash(f"{kind.capitalize()} '{title}' uploaded successfully.", "success")
        return redirect(url_for("admin_manage"))

    return render_template("admin_upload.html", branches=BRANCHES, years=YEARS, semesters=SEMESTERS, form={})


@app.route("/admin/manage")
@login_required(role="admin")
def admin_manage():
    kind = request.args.get("kind", "")
    db = get_db()
    if kind in ("syllabus", "notes"):
        items = db.execute("SELECT * FROM resources WHERE kind=? ORDER BY created_at DESC", (kind,)).fetchall()
    else:
        items = db.execute("SELECT * FROM resources ORDER BY created_at DESC").fetchall()
    return render_template("admin_manage.html", items=items, kind=kind)


@app.route("/admin/delete/<int:resource_id>", methods=["POST"])
@login_required(role="admin")
def admin_delete(resource_id):
    db = get_db()
    res = db.execute("SELECT * FROM resources WHERE id = ?", (resource_id,)).fetchone()
    if not res:
        abort(404)
    file_path = os.path.join(UPLOAD_ROOT, res["kind"], res["filename"])
    if os.path.exists(file_path):
        os.remove(file_path)
    db.execute("DELETE FROM resources WHERE id = ?", (resource_id,))
    db.commit()
    flash("Resource deleted.", "success")
    return redirect(url_for("admin_manage"))


@app.route("/admin/students")
@login_required(role="admin")
def admin_students():
    q = request.args.get("q", "").strip()
    db = get_db()
    if q:
        like = f"%{q}%"
        students = db.execute(
            """SELECT * FROM users WHERE role='student' AND
               (name LIKE ? OR email LIKE ? OR enrollment_no LIKE ?)
               ORDER BY created_at DESC""",
            (like, like, like),
        ).fetchall()
    else:
        students = db.execute(
            "SELECT * FROM users WHERE role='student' ORDER BY created_at DESC"
        ).fetchall()
    return render_template("admin_students.html", students=students, q=q)


@app.route("/admin/students/<int:user_id>/toggle", methods=["POST"])
@login_required(role="admin")
def admin_toggle_student(user_id):
    db = get_db()
    student = db.execute("SELECT * FROM users WHERE id = ? AND role='student'", (user_id,)).fetchone()
    if not student:
        abort(404)
    new_status = 0 if student["active"] else 1
    db.execute("UPDATE users SET active = ? WHERE id = ?", (new_status, user_id))
    db.commit()
    flash(f"{student['name']} {'activated' if new_status else 'deactivated'}.", "success")
    return redirect(url_for("admin_students"))


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return render_template("error.html", code=404, message="Page not found."), 404


@app.errorhandler(413)
def too_large(e):
    flash("File too large. Maximum upload size is 25 MB.", "error")
    return redirect(request.referrer or url_for("index"))


@app.errorhandler(500)
def server_error(e):
    return render_template("error.html", code=500, message="Something went wrong on our end."), 500


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
