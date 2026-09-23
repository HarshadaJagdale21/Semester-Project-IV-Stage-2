import os
import datetime
import json
from functools import wraps
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["studymate_rcpit"]

users_col = db["users"]
syllabus_col = db["syllabus"]
notes_col = db["notes"]
pyq_col = db["question_papers"]
aptitude_q_col = db["aptitude_questions"]
attempts_col = db["test_attempts"]
study_plans_col = db["study_plans"]
projects_col = db["projects"]
books_col = db["books"]

JWT_SECRET = "rcpit_super_secret_jwt_key_2026_production_safe_string_32chars"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")

# --- AUTH DECORATORS ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization token missing"}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid token header format"}), 401
        
        token = parts[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = users_col.find_one({"_id": ObjectId(payload["id"])})
            if not current_user:
                return jsonify({"error": "User account no longer exists"}), 401
            current_user["_id"] = str(current_user["_id"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session token has expired. Please log in again."}), 401
        except Exception:
            return jsonify({"error": "Invalid authentication token"}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.get("role") != required_role:
                return jsonify({"error": f"Forbidden: Requires {required_role} privileges"}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

# --- LOCAL OLLAMA CALLER ---
def ask_ollama(prompt, system="You are an expert engineering professor at R. C. Patel Institute of Technology (RCPIT), Shirpur."):
    try:
        res = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3.2:latest",
                "prompt": f"{system}\n\nTask:\n{prompt}",
                "stream": False,
                "options": {
                    "num_predict": 450,
                    "temperature": 0.2
                }
            },
            timeout=120
        )
        if res.status_code == 200:
            return res.json().get("response", "").strip()
        else:
            print("[Ollama Status Error]:", res.status_code, res.text)
    except Exception as e:
        print("[Ollama Connection Error]:", e)

    return "Could not connect to Ollama. Make sure Ollama is running at http://127.0.0.1:11434."

# --- AUTHENTICATION APIS ---
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip()
    password = data.get("password")

    if not email or not password or not name:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email is already registered"}), 400

    user = {
        "name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": data.get("role", "student"),
        "branch": data.get("branch", "AIML"),
        "year": data.get("year", "2024"),
        "semester": data.get("semester", "Semester 5"),
        "enrollment_number": data.get("enrollment_number", "RCPIT-STU-001"),
        "created_at": datetime.datetime.utcnow()
    }
    res = users_col.insert_one(user)
    user_id_str = str(res.inserted_id)

    token = jwt.encode({
        "id": user_id_str,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {
            "id": user_id_str,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "branch": user["branch"],
            "year": user["year"],
            "semester": user["semester"]
        }
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = users_col.find_one({"email": email})
    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"error": "Invalid email or password"}), 401

    user_id_str = str(user["_id"])
    token = jwt.encode({
        "id": user_id_str,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {
            "id": user_id_str,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "branch": user.get("branch", "AIML"),
            "year": user.get("year", "2024"),
            "semester": user.get("semester", "Semester 5")
        }
    }), 200

@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_current_user_profile(current_user):
    return jsonify({
        "user": {
            "id": current_user["_id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"],
            "branch": current_user.get("branch", "AIML"),
            "year": current_user.get("year", "2024"),
            "semester": current_user.get("semester", "Semester 5"),
            "enrollment_number": current_user.get("enrollment_number", "")
        }
    }), 200

# --- STUDENT DASHBOARD ANALYTICS ---
@app.route("/api/student/dashboard-stats", methods=["GET"])
@token_required
def get_student_dashboard_stats(current_user):
    email = current_user["email"]
    
    attempts = list(attempts_col.find({"student_email": email}).sort("submitted_at", -1))
    total_tests = len(attempts)
    
    avg_accuracy = 0
    weak_topics_set = set()
    performance_history = []
    
    if attempts:
        total_accuracy = sum(a.get("accuracy", 0) for a in attempts)
        avg_accuracy = round(total_accuracy / total_tests, 1)
        for a in attempts:
            for wt in a.get("weak_topics", []):
                weak_topics_set.add(wt)
            performance_history.append({
                "date": a.get("submitted_at").strftime("%d %b") if a.get("submitted_at") else "Test",
                "accuracy": a.get("accuracy", 0),
                "score": a.get("score", 0)
            })
        performance_history.reverse()
    else:
        performance_history = [
            {"date": "Baseline", "accuracy": 65, "score": 3}
        ]

    subjects_tracked = [
        {"subject": "Machine Learning", "progress": 72, "units_completed": 4, "total_units": 6},
        {"subject": "Database Systems", "progress": 85, "units_completed": 5, "total_units": 6},
        {"subject": "Algorithms & DAA", "progress": 60, "units_completed": 3, "total_units": 5},
        {"subject": "AI Fundamentals", "progress": 90, "units_completed": 5, "total_units": 5}
    ]

    tasks = [
        {"id": 1, "title": "Review Decision Trees & SVM", "subject": "Machine Learning", "due": "Tomorrow", "priority": "High"},
        {"id": 2, "title": "Solve 2025 DBMS End-Sem PYQ", "subject": "Database Systems", "due": "In 2 days", "priority": "Medium"},
        {"id": 3, "title": "Attempt QuickSort & Time Complexity Quiz", "subject": "Algorithms & DAA", "due": "In 3 days", "priority": "High"}
    ]

    weak_topics_list = list(weak_topics_set) if weak_topics_set else ["Percentages", "Normalization", "QuickSort Complexity"]

    return jsonify({
        "stats": {
            "total_tests": total_tests,
            "avg_accuracy": avg_accuracy,
            "total_subjects": len(subjects_tracked),
            "weak_topics_count": len(weak_topics_list)
        },
        "performance_history": performance_history,
        "subject_progress": subjects_tracked,
        "weak_topics": weak_topics_list,
        "tasks": tasks
    }), 200

# --- ACADEMIC RESOURCES (Syllabus, Notes, PYQs) ---
@app.route("/api/resources", methods=["GET"])
def get_resources():
    res_type = request.args.get("type", "notes")
    branch = request.args.get("branch")
    semester = request.args.get("semester")
    subject = request.args.get("subject")

    col = {"syllabus": syllabus_col, "notes": notes_col, "pyqs": pyq_col}.get(res_type, notes_col)
    query = {}
    if branch:
        query["branch"] = branch
    if semester:
        query["semester"] = semester
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}

    records = list(col.find(query).sort("created_at", -1))
    for r in records:
        r["_id"] = str(r["_id"])
    return jsonify(records), 200

@app.route("/api/resources", methods=["POST"])
@token_required
@role_required("admin")
def add_resource(current_user):
    data = request.json or {}
    res_type = data.get("type", "notes")
    col = {"syllabus": syllabus_col, "notes": notes_col, "pyqs": pyq_col}.get(res_type, notes_col)
    
    data["created_at"] = datetime.datetime.utcnow()
    data["created_by"] = current_user["email"]
    inserted = col.insert_one(data)
    return jsonify({"message": "Resource saved successfully", "id": str(inserted.inserted_id)}), 201

# --- MULTI-AGENT AI SYSTEM ---
@app.route("/api/ai/doubt", methods=["POST"])
@token_required
def solve_doubt(current_user):
    data = request.json or {}
    question = data.get("question", "").strip()
    subject = data.get("subject", "General Engineering").strip()
    mode = data.get("mode", "Detailed")

    if not question:
        return jsonify({"error": "Question field is required"}), 400

    matched_notes = list(notes_col.find({"subject": {"$regex": subject, "$options": "i"}}).limit(2))
    notes_text = "\n".join([f"- {n.get('title')}: {n.get('content')}" for n in matched_notes])
    grounding = "RCPIT Department Notes" if notes_text else "Engineering Curriculum Reference"

    prompt = """You are an expert professor for engineering students at RCPIT.
Reference Materials:
{notes_text if notes_text else 'Standard textbook reference for ' + subject}

Subject: {subject}
Student Question: {question}

Provide your answer in clear Markdown with the following sections:
### 1. Direct Summary
[2-3 sentences concise explanation]

### 2. Core Concepts & Steps
[Key mechanisms, formulas, or bullet points]

### 3. Concrete Example
[Practical engineering or code example]

### 4. Viva / Exam Tip
[1 high-yield point for exams]
"""
    answer = ask_ollama(prompt, system=f"You are the StudyMate Academic AI Assistant for {subject}.")
    return jsonify({"answer": answer, "grounding": grounding, "mode": mode}), 200

@app.route("/api/ai/study-plan", methods=["POST"])
@token_required
def generate_study_plan(current_user):
    data = request.json or {}
    subject = data.get("subject", "").strip()
    branch = data.get("branch", current_user.get("branch", "AIML"))
    days = int(data.get("days", 5))
    hours = int(data.get("hours_per_day", 3))
    weak_topics = data.get("weak_topics", [])
    
    if not subject:
        return jsonify({"error": "Subject is required to generate a targeted study plan"}), 400

    weak_topics_str = ", ".join(weak_topics) if weak_topics else f"Core topics of {subject}"

    prompt = """Generate a focused {days}-day study plan EXCLUSIVELY for the engineering subject '{subject}' (Branch: {branch}).
DO NOT include topics from unrelated subjects. Focus entirely on f'{subject}'.
Student weak topics: {weak_topics_str}.
Daily study time: {hours} hours.

Return ONLY a valid JSON array of objects. No introductory or trailing text.
[
  {{"day": 1, "topic": f"Exact topic from {subject}", "hours": {hours}, "tasks": ["Read concept", "Solve 3 PYQs", "Formula summary"]}}
]
"""
    raw_res = ask_ollama(prompt, system=f"You are an academic curriculum planner specialized strictly in {subject}. Return ONLY a JSON array.")
    try:
        start = raw_res.find('[')
        end = raw_res.rfind(']') + 1
        plan = json.loads(raw_res[start:end])
    except Exception:
        plan = [
            {"day": i + 1, "topic": f"{subject} - Unit {i + 1} Foundations & PYQs", "hours": hours, "tasks": ["Review textbook notes", "Practice previous exam questions", "Summarize core definitions"]}
            for i in range(days)
        ]
    
    study_plans_col.insert_one({
        "student_email": current_user["email"],
        "subject": subject,
        "branch": branch,
        "days": days,
        "plan": plan,
        "created_at": datetime.datetime.utcnow()
    })
    
    return jsonify({"plan": plan, "subject": subject, "branch": branch}), 200

@app.route("/api/ai/generate-test", methods=["POST"])
@token_required
def generate_ai_test(current_user):
    data = request.json or {}
    subject = data.get("subject", "Artificial Intelligence")
    count = min(int(data.get("count", 5)), 10)
    difficulty = data.get("difficulty", "Medium")

    prompt = """Generate {count} multiple choice questions strictly for the engineering subject '{subject}' at {difficulty} difficulty level.
Return ONLY a valid JSON array. Each object must have:
- "question": string
- "options": array of 4 distinct string choices
- "correct_answer": exact string matching one option
- "explanation": brief explanation

[
  {{"question": "What is...", "options": ["Choice A", "Choice B", "Choice C", "Choice D"], "correct_answer": "Choice A", "explanation": "Explanation here"}}
]
"""
    raw_res = ask_ollama(prompt, system="You are the StudyMate Technical Test Generator. Return ONLY a valid JSON array.")
    try:
        start = raw_res.find('[')
        end = raw_res.rfind(']') + 1
        test_questions = json.loads(raw_res[start:end])
    except Exception:
        test_questions = [
            {
                "question": f"Key concept in {subject}",
                "options": ["Definition 1", "Definition 2", "Definition 3", "Definition 4"],
                "correct_answer": "Definition 1",
                "explanation": f"Fundamental property of {subject}."
            }
        ]
    return jsonify({"questions": test_questions, "subject": subject}), 200

@app.route("/api/ai/recommendations", methods=["GET"])
@token_required
def get_recommendations(current_user):
    email = current_user["email"]
    last_attempt = attempts_col.find_one({"student_email": email}, sort=[("submitted_at", -1)])
    weak_topics = last_attempt.get("weak_topics", []) if last_attempt else []
    
    recommendations = []
    if weak_topics:
        for t in weak_topics:
            recommendations.append({
                "topic": t,
                "action": f"Review {t} reference notes and complete 5 mock practice questions",
                "priority": "High"
            })
    else:
        recommendations.append({
            "topic": "Current Semester Units",
            "action": "Solid performance across modules! Continue solving End-Semester PYQs.",
            "priority": "Normal"
        })
    return jsonify({"recommendations": recommendations, "weak_topics": weak_topics}), 200

# --- APTITUDE & EXAM EVALUATION ---
@app.route("/api/aptitude/questions", methods=["GET"])
def get_aptitude_questions():
    qs = list(aptitude_q_col.find())
    for q in qs:
        q["_id"] = str(q["_id"])
        q.pop("correct_answer", None)
        q.pop("explanation", None)
    return jsonify(qs), 200

@app.route("/api/tests/submit", methods=["POST"])
@token_required
def submit_exam(current_user):
    data = request.json or {}
    answers = data.get("answers", {})

    all_qs = list(aptitude_q_col.find())
    score = 0
    total = len(all_qs)
    weak_topics = []
    detailed_results = []

    for q in all_qs:
        qid = str(q["_id"])
        chosen = answers.get(qid)
        correct = q.get("correct_answer")
        is_correct = (chosen == correct)
        
        if is_correct:
            score += 1
        elif chosen is not None:
            weak_topics.append(q.get("topic", "General"))

        detailed_results.append({
            "id": qid,
            "question": q.get("question"),
            "chosen": chosen,
            "correct_answer": correct,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    accuracy = round((score / total * 100), 2) if total > 0 else 0
    attempt = {
        "student_email": current_user["email"],
        "student_name": current_user["name"],
        "score": score,
        "total": total,
        "accuracy": accuracy,
        "weak_topics": list(set(weak_topics)),
        "submitted_at": datetime.datetime.utcnow()
    }
    inserted = attempts_col.insert_one(attempt)
    attempt["_id"] = str(inserted.inserted_id)
    attempt["detailed_results"] = detailed_results
    return jsonify(attempt), 200

# --- ADMIN DASHBOARD ANALYTICS ---
@app.route("/api/admin/stats", methods=["GET"])
@token_required
@role_required("admin")
def admin_stats(current_user):
    return jsonify({
        "total_students": users_col.count_documents({"role": "student"}),
        "total_notes": notes_col.count_documents({}),
        "total_syllabus": syllabus_col.count_documents({}),
        "total_pyqs": pyq_col.count_documents({}),
        "total_questions": aptitude_q_col.count_documents({}),
        "total_test_attempts": attempts_col.count_documents({})
    }), 200

@app.route("/api/admin/students", methods=["GET"])
@token_required
@role_required("admin")
def admin_student_list(current_user):
    students = list(users_col.find({"role": "student"}, {"password_hash": 0}))
    for s in students:
        s["_id"] = str(s["_id"])
        last = attempts_col.find_one({"student_email": s["email"]}, sort=[("submitted_at", -1)])
        s["last_score"] = f"{last['score']}/{last['total']}" if last else "Not Attempted"
        s["accuracy"] = f"{last['accuracy']}%" if last else "N/A"
    return jsonify(students), 200

if __name__ == "__main__":
    app.run(port=5000, debug=True)