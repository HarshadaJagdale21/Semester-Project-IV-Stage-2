from flask import Flask, render_template, send_from_directory, request, jsonify, redirect, url_for, session, flash
import os
import json
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

import database
from auth import login_required, admin_required, current_user

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-me")

# Create the users table (if it doesn't already exist) as soon as the app starts
database.init_db()

# --- Config ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET = os.path.join(BASE_DIR, "dataset")
SYLLABUS_PATH = os.path.join(DATASET, "syllabus")
PAPERS_PATH = os.path.join(DATASET, "papers")
NOTES_PATH = os.path.join(DATASET, "notes")
BOOKS_PATH = os.path.join(DATASET, "books")
APTITUDE_PATH = os.path.join(DATASET, "aptitude")
PROJECTS_PATH = os.path.join(DATASET, "projects")

BRANCHES = {
    "CSE": "Computer Science & Engineering",
    "AIML": "AI & Machine Learning",
    "DS": "Data Science",
    "IT": "Information Technology",
    "ENTC": "Electronics & Telecommunication",
    "ME": "Mechanical Engineering",
    "CE": "Civil Engineering",
    "EE": "Electrical Engineering",
}

YEARS = {
    "FY": {"name": "First Year", "semesters": ["Sem 1", "Sem 2"]},
    "SY": {"name": "Second Year", "semesters": ["Sem 3", "Sem 4"]},
    "TY": {"name": "Third Year", "semesters": ["Sem 5", "Sem 6"]},
    "BE": {"name": "Final Year", "semesters": ["Sem 7", "Sem 8"]},
}


# --- Helpers ---
def safe_listdir(path):
    try:
        return sorted(os.listdir(path))
    except FileNotFoundError:
        return []

def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def search_dataset(query):
    results = []
    query_lower = query.lower()
    for root, dirs, files in os.walk(DATASET):
        for fname in files:
            if query_lower in fname.lower():
                rel = os.path.relpath(os.path.join(root, fname), DATASET)
                parts = rel.replace("\\", "/").split("/")
                rtype = parts[0] if parts else "file"
                results.append({"name": fname, "path": rel.replace("\\", "/"), "type": rtype})
    return results

# ==================== ROUTES ====================

# HOME
@app.route('/')
def home():
    return render_template('index.html')


# ==================== AUTHENTICATION ====================

@app.route('/register', methods=['GET', 'POST'])
def register():
    # If already logged in, no need to register again
    if session.get('user_id'):
        return redirect(url_for('home'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        enrollment_no = request.form.get('enrollment_no', '').strip()
        branch = request.form.get('branch', '')
        year = request.form.get('year', '')
        semester = request.form.get('semester', '')

        # --- Validation ---
        if not all([name, email, password, confirm_password, enrollment_no, branch, year, semester]):
            flash('Please fill in all fields.', 'error')
            return render_template('register.html', branches=BRANCHES, years=YEARS, years_json=json.dumps(
                {k: v['semesters'] for k, v in YEARS.items()}))

        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return render_template('register.html', branches=BRANCHES, years=YEARS, years_json=json.dumps(
                {k: v['semesters'] for k, v in YEARS.items()}))

        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('register.html', branches=BRANCHES, years=YEARS, years_json=json.dumps(
                {k: v['semesters'] for k, v in YEARS.items()}))

        # --- Hash the password (never store plain text!) ---
        password_hash = generate_password_hash(password)

        created = database.create_user(
            name=name, email=email, password_hash=password_hash, role='student',
            enrollment_no=enrollment_no, branch=branch, year=year, semester=semester
        )

        if not created:
            flash('An account with this email already exists. Please login instead.', 'error')
            return render_template('register.html', branches=BRANCHES, years=YEARS, years_json=json.dumps(
                {k: v['semesters'] for k, v in YEARS.items()}))

        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html', branches=BRANCHES, years=YEARS, years_json=json.dumps(
        {k: v['semesters'] for k, v in YEARS.items()}))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('user_id'):
        return redirect(url_for('home'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        user = database.get_user_by_email(email)

        if user is None or not check_password_hash(user['password_hash'], password):
            flash('Invalid email or password.', 'error')
            return render_template('login.html')

        if user['role'] != 'student':
            flash('Please use the Admin Login page.', 'error')
            return render_template('login.html')

        if not user['active']:
            flash('This account has been deactivated. Contact the administrator.', 'error')
            return render_template('login.html')

        # --- Log the user in: save minimal info in the session cookie ---
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['role'] = user['role']

        flash(f"Welcome back, {user['name']}!", 'success')
        return redirect(url_for('home'))

    return render_template('login.html')


@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('role') == 'admin':
        return redirect(url_for('admin_dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        user = database.get_user_by_email(email)

        if user is None or not check_password_hash(user['password_hash'], password):
            flash('Invalid admin credentials.', 'error')
            return render_template('admin_login.html')

        if user['role'] != 'admin':
            flash('This account is not an admin account.', 'error')
            return render_template('admin_login.html')

        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['role'] = user['role']

        flash(f"Welcome, {user['name']}!", 'success')
        return redirect(url_for('admin_dashboard'))

    return render_template('admin_login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('home'))


@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    user = current_user()
    return render_template(
        'admin_dashboard.html',
        user=user,
        student_count=database.count_users('student'),
        admin_count=database.count_users('admin'),
    )

# --- SYLLABUS ---
@app.route('/syllabus')
def syllabus():
    return render_template('syllabus.html', branches=safe_listdir(SYLLABUS_PATH))

@app.route('/syllabus/<branch>')
def syllabus_years(branch):
    return render_template('years.html', branch=branch, years=safe_listdir(os.path.join(SYLLABUS_PATH, branch)))

@app.route('/syllabus/<branch>/<year>')
def syllabus_files(branch, year):
    return render_template('files.html', branch=branch, year=year, files=safe_listdir(os.path.join(SYLLABUS_PATH, branch, year)))

@app.route('/syllabus/<branch>/<year>/<path:file>')
def syllabus_open(branch, year, file):
    return send_from_directory(os.path.join(SYLLABUS_PATH, branch, year), file)

# --- PAPERS ---
@app.route('/papers')
def papers():
    return render_template('papers.html', branches=safe_listdir(PAPERS_PATH))

@app.route('/papers/<branch>')
def papers_years(branch):
    return render_template('years.html', branch=branch, years=safe_listdir(os.path.join(PAPERS_PATH, branch)), type="papers")

@app.route('/papers/<branch>/<year>')
def papers_files(branch, year):
    return render_template('files.html', branch=branch, year=year, files=safe_listdir(os.path.join(PAPERS_PATH, branch, year)), type="papers")

@app.route('/papers/<branch>/<year>/<path:file>')
def papers_open(branch, year, file):
    return send_from_directory(os.path.join(PAPERS_PATH, branch, year), file)

# --- NOTES ---
@app.route('/notes')
def notes():
    return render_template('notes.html', branches=safe_listdir(NOTES_PATH))

@app.route('/notes/<branch>')
def notes_files(branch):
    path = os.path.join(NOTES_PATH, branch)
    files = safe_listdir(path)
    return render_template('files.html', branch=branch, year="", files=files, type="notes")

@app.route('/notes/<branch>/<path:file>')
def notes_open(branch, file):
    return send_from_directory(os.path.join(NOTES_PATH, branch), file)

# --- BOOKS ---
@app.route('/books')
def books():
    data = load_json(os.path.join(BOOKS_PATH, "books.json"))
    branch_set = sorted(set(b["branch"] for b in data if "branch" in b))
    return render_template('books.html', books=data, branches=branch_set)

# --- APTITUDE ---
@app.route('/aptitude')
def aptitude():
    data = load_json(os.path.join(APTITUDE_PATH, "aptitude.json"))
    if isinstance(data, list):
        data = {"quantitative": data}
    return render_template('aptitude.html', aptitude_data=data)

# --- PROJECTS ---
@app.route('/projects')
def projects():
    data = load_json(os.path.join(PROJECTS_PATH, "projects.json"))
    domains = sorted(set(p.get("domain", "") for p in data))
    return render_template('projects.html', projects=data, domains=domains)

# --- SEARCH ---
@app.route('/search')
def search():
    q = request.args.get('q', '').strip()
    results = search_dataset(q) if q else []
    return render_template('search.html', query=q, results=results)

# --- AI STUDY PLANNER ---
@app.route('/ai/study-planner', methods=['GET', 'POST'])
@login_required
def study_planner():
    plan = None
    if request.method == 'POST':
        from ai_agents.study_planner import StudyPlannerAgent
        agent = StudyPlannerAgent()
        plan = agent.generate_plan(
            branch=request.form.get('branch', 'CSE'),
            semester=request.form.get('semester', 'Sem 5'),
            exam_date=request.form.get('exam_date', ''),
            hours_per_day=int(request.form.get('hours', 6)),
            subjects=request.form.get('subjects', '')
        )
    return render_template('study_planner.html', plan=plan, branches=BRANCHES)

# --- AI TEST GENERATOR ---
@app.route('/ai/test-generator', methods=['GET', 'POST'])
@login_required
def test_generator():
    paper = None
    if request.method == 'POST':
        from ai_agents.test_generator import TestGeneratorAgent
        agent = TestGeneratorAgent()
        paper = agent.generate_test(
            subject=request.form.get('subject', 'General'),
            question_type=request.form.get('question_type', 'mcq'),
            num_questions=int(request.form.get('num_questions', 10)),
            difficulty=request.form.get('difficulty', 'medium'),
            units=request.form.get('units', '')
        )
    return render_template('test_generator.html', paper=paper)

# --- AI CHATBOT ---
@app.route('/ai/chatbot')
@login_required
def chatbot():
    return render_template('chatbot.html')

@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.get_json()
    question = data.get('question', '')
    if not question:
        return jsonify({"answer": "Please ask a question.", "sources": []})
    from ai_agents.doubt_solver import DoubtSolverAgent
    agent = DoubtSolverAgent()
    result = agent.answer(question)
    return jsonify(result)

# --- ERROR HANDLER ---
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

# --- RUN ---
if __name__ == "__main__":
    app.run(debug=True, port=5000)