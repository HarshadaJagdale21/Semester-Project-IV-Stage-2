"""
database.py
------------
Very small, beginner-friendly database layer for StudyMate.

We use SQLite because:
- It needs NO separate server (unlike MongoDB/MySQL)
- It is just one file: studymate.db
- Python already has built-in support for it (sqlite3)

This file gives us:
- get_db()          -> a connection to the database
- init_db()         -> creates the "users" table if it does not exist
- create_user()     -> saves a new student/admin
- get_user_by_email() -> looks up a user during login
"""

import sqlite3
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "studymate.db")


def get_db():
    """Open a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us access columns by name, e.g. row["email"]
    return conn


def init_db():
    """Create the users table if it doesn't already exist. Safe to call every time the app starts."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',   -- 'student' or 'admin'
            enrollment_no TEXT,
            branch TEXT,
            year TEXT,
            semester TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def create_user(name, email, password_hash, role="student",
                 enrollment_no=None, branch=None, year=None, semester=None):
    """Insert a new user. Returns True on success, False if the email already exists."""
    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO users
               (name, email, password_hash, role, enrollment_no, branch, year, semester, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (name, email, password_hash, role, enrollment_no, branch, year, semester,
             datetime.utcnow().isoformat())
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        # This happens if the email is already registered (UNIQUE constraint)
        return False
    finally:
        conn.close()


def get_user_by_email(email):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return row


def get_user_by_id(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return row


def count_users(role=None):
    conn = get_db()
    if role:
        row = conn.execute("SELECT COUNT(*) as c FROM users WHERE role = ?", (role,)).fetchone()
    else:
        row = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()
    conn.close()
    return row["c"]
