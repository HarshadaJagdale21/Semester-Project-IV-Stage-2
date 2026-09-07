"""
seed_admin.py
--------------
Run this ONCE to create the very first admin account.

Usage (from the project's root SmartCampusAI/ folder):

    python scripts/seed_admin.py

It reads ADMIN_EMAIL and ADMIN_PASSWORD from your .env file.
If they are not set, it falls back to a default (which you should change immediately).
"""

import os
import sys

# Allow importing database.py and auth from the project root when this script
# is run as `python scripts/seed_admin.py`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

import database

load_dotenv()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@rcpit.ac.in")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_NAME = "StudyMate Admin"

if __name__ == "__main__":
    database.init_db()

    existing = database.get_user_by_email(ADMIN_EMAIL)
    if existing:
        print(f"An account with email '{ADMIN_EMAIL}' already exists (role: {existing['role']}).")
        print("Nothing to do. If you want a different admin, change ADMIN_EMAIL in your .env file.")
    else:
        password_hash = generate_password_hash(ADMIN_PASSWORD)
        database.create_user(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password_hash=password_hash,
            role="admin",
        )
        print("Admin account created successfully!")
        print(f"  Email:    {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
        print("You can now log in at /admin/login")
