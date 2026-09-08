"""
Creates the first Admin account for Smart Campus.

Run this once after cloning the project:
    python seed_admin.py
"""

import os
import sys
import getpass
import sqlite3
from datetime import datetime

from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "smartcampus.db")

# Import init_db from app.py so the schema is guaranteed to match.
sys.path.insert(0, BASE_DIR)
from app import init_db  # noqa: E402


def main():
    init_db()

    # Admin credentials
    name = "RCPIT Admin"
    email = "rcpit123"
    password = "rcpit@123"

    if len(password) < 6:
        print("Password must be at least 6 characters. Aborting.")
        return

    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row

    existing = db.execute(
        "SELECT role FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if existing:
        print(
            f"A user with email '{email}' already exists "
            f"(role={existing['role']}). No changes made."
        )
        db.close()
        return

    password_hash = generate_password_hash(password)

    db.execute(
        """INSERT INTO users (name, email, password_hash, role, active, created_at)
           VALUES (?, ?, ?, 'admin', 1, ?)""",
        (name, email, password_hash, datetime.utcnow().isoformat()),
    )

    db.commit()
    db.close()

    print(f"Admin account created for {name} <{email}>.")
    print("You can now log in at /admin/login")


if __name__ == "__main__":
    main()