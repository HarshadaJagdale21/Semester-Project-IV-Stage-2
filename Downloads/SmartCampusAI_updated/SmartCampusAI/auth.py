"""
auth.py
--------
Handles everything related to "who is logged in".

We use Flask's built-in `session` (a secure cookie) to remember a user
between page loads. We never store the password itself in the session —
only the user's id and role.

Two decorators are provided to protect routes:
    @login_required   -> user must be logged in (student OR admin)
    @admin_required   -> user must be logged in AND role == 'admin'
"""

from functools import wraps
from flask import session, redirect, url_for, flash, request
from database import get_user_by_id


def current_user():
    """Return the logged-in user's row from the database, or None if nobody is logged in."""
    if "user_id" not in session:
        return None
    return get_user_by_id(session["user_id"])


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to continue.", "error")
            return redirect(url_for("login", next=request.path))
        return view_func(*args, **kwargs)
    return wrapped


def admin_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in as admin to continue.", "error")
            return redirect(url_for("admin_login"))
        if session.get("role") != "admin":
            flash("Unauthorized: this page is for admins only.", "error")
            return redirect(url_for("home"))
        return view_func(*args, **kwargs)
    return wrapped
