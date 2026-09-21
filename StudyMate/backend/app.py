import os
import datetime
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

app = Flask(__name__)
CORS(app)

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

JWT_SECRET = "rcpit_super_secret_jwt_key_2026"

# Core Ollama caller
def ask_ollama(prompt, system="You are an expert engineering professor at R. C. Patel Institute of Technology (RCPIT), Shirpur."):
    try:
        res = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "llama3.2",
                "prompt": f"{system}\n\nTask:\n{prompt}",
                "stream": False,
                "options": {
                    "num_predict": 300,
                    "temperature": 0.3
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

    return "Could not connect to Ollama. Make sure Ollama is running."

# --- AUTHENTICATION APIS ---
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    email = data.get("email")
    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    user = {
        "name": data.get("name"),
        "email": email,
        "password_hash": generate_password_hash(data.get("password")),
        "role": "student",
        "branch": data.get("branch", "Artificial Intelligence & Machine Learning"),
        "year": data.get("year", "Third Year"),
        "semester": data.get("semester", "Semester 5"),
        "enrollment_number": data.get("enrollment_number", "RCPIT-2026-001"),
        "created_at": datetime.datetime.utcnow()
    }
    res = users_col.insert_one(user)
    user["_id"] = res.inserted_id
    token = jwt.encode({"id": str(user["_id"]), "role": "student", "email": email, "name": user["name"]}, JWT_SECRET, algorithm="HS256")
    return jsonify({"token": token, "user": {"name": user["name"], "role": "student", "email": email, "branch": user["branch"]}}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    
    user = users_col.find_one({"email": email})
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode({
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "branch": user.get("branch", "AIML"),
            "year": user.get("year", "Third Year"),
            "semester": user.get("semester", "Semester 5")
        }
    }), 200

# --- ACADEMIC RESOURCES (Syllabus, Notes, PYQs) ---
@app.route("/api/resources", methods=["GET"])
def get_resources():
    res_type = request.args.get("type", "notes")
    col = {"syllabus": syllabus_col, "notes": notes_col, "pyqs": pyq_col}.get(res_type, notes_col)
    records = list(col.find().sort("created_at", -1))
    for r in records:
        r["_id"] = str(r["_id"])
    return jsonify(records)

@app.route("/api/resources", methods=["POST"])
def add_resource():
    data = request.json or {}
    res_type = data.get("type", "notes")
    col = {"syllabus": syllabus_col, "notes": notes_col, "pyqs": pyq_col}.get(res_type, notes_col)
    data["created_at"] = datetime.datetime.utcnow()
    col.insert_one(data)
    return jsonify({"message": "Resource saved successfully"}), 201

# --- MULTI-AGENT AI SYSTEM ---

# Agent 1: Doubt Solver Agent (RAG Grounded)
@app.route("/api/ai/doubt", methods=["POST"])
def solve_doubt():
    data = request.json or {}
    question = data.get("question", "")
    subject = data.get("subject", "General")
    mode = data.get("mode", "Detailed Explanation")

    # Semantic grounding check
    matched_notes = list(notes_col.find({"subject": {"$regex": subject, "$options": "i"}}).limit(2))
    notes_text = " ".join([n.get("content", "") for n in matched_notes])
    grounding = "RCPIT College Repository" if notes_text else "Standard Engineering Curriculum"

    prompt = """
    Context from College Repository: {notes_text if notes_text else 'Standard Syllabus'}
    Subject: {subject}
    Format Mode: {mode}

    Question: {question}

    Provide a clear, authoritative response. State key formulas, algorithmic steps, or bullet points where relevant.
    """
    answer = ask_ollama(prompt, system="You are the StudyMate AI Doubt Solver Agent for RCPIT students.")
    return jsonify({"answer": answer, "grounding": grounding, "mode": mode})

# Agent 2: Study Planner Agent
@app.route("/api/ai/study-plan", methods=["POST"])
def generate_study_plan():
    data = request.json or {}
    subject = data.get("subject", "Engineering Subject")
    days = int(data.get("days", 5))
    hours = int(data.get("hours_per_day", 3))
    weak_topics = data.get("weak_topics", [])

    prompt = """
    Generate an optimal {days}-day study timetable for f'{subject}' with {hours} study hours per day.
    Priority weak topics to cover: {', '.join(weak_topics) if weak_topics else 'Core units & PYQ practice'}.
    
    Respond in strict JSON format as an array of objects:
    [
      {{"day": 1, "topic": "Topic Name", "hours": {hours}, "tasks": ["Task 1", "Task 2"]}}
    ]
    """
    raw_res = ask_ollama(prompt, system="You are the StudyMate AI Study Planner Agent. Return ONLY valid JSON array.")
    try:
        start = raw_res.find('[')
        end = raw_res.rfind(']') + 1
        plan = json.loads(raw_res[start:end])
    except Exception:
        plan = [
            {"day": i + 1, "topic": f"Unit {i + 1}: Key Fundamentals & Practice", "hours": hours, "tasks": ["Read lecture notes", "Solve 5 PYQs", "Review weak formulas"]}
            for i in range(days)
        ]
    return jsonify({"plan": plan, "subject": subject})

# Agent 3: AI Test Generator Agent
@app.route("/api/ai/generate-test", methods=["POST"])
def generate_ai_test():
    data = request.json or {}
    subject = data.get("subject", "Artificial Intelligence")
    count = int(data.get("count", 3))
    difficulty = data.get("difficulty", "Medium")

    prompt = """
    Generate {count} multiple choice questions (MCQs) for the subject f'{subject}' at f'{difficulty}' difficulty.
    Respond in strict JSON format as an array of objects:
    [
      {{"question": "What is...", "options": ["A", "B", "C", "D"], "correct_answer": "A", "explanation": "Why..."}}
    ]
    """
    raw_res = ask_ollama(prompt, system="You are the StudyMate AI Test Generator Agent. Return ONLY valid JSON array.")
    try:
        start = raw_res.find('[')
        end = raw_res.rfind(']') + 1
        test_questions = json.loads(raw_res[start:end])
    except Exception:
        test_questions = [
            {
                "question": f"Sample Generated Question on {subject}",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A",
                "explanation": "Standard textbook definition."
            }
        ]
    return jsonify({"questions": test_questions})

# Agent 4: Recommendation Agent
@app.route("/api/ai/recommendations", methods=["GET"])
def get_recommendations():
    email = request.args.get("email")
    last_attempt = attempts_col.find_one({"student_email": email}, sort=[("submitted_at", -1)])
    weak_topics = last_attempt.get("weak_topics", []) if last_attempt else []
    
    recommendations = []
    if weak_topics:
        for t in weak_topics:
            recommendations.append({
                "topic": t,
                "action": f"Review {t} lecture notes and attempt 10 practice questions",
                "priority": "High"
            })
    else:
        recommendations.append({
            "topic": "General Syllabus",
            "action": "Great performance! Continue with Mock Placement Tests and PYQ solving.",
            "priority": "Normal"
        })
    return jsonify({"recommendations": recommendations, "weak_topics": weak_topics})

# --- APTITUDE & EXAM EVALUATION ---
@app.route("/api/aptitude/questions", methods=["GET", "POST"])
def handle_aptitude_questions():
    if request.method == "POST":
        data = request.json or {}
        aptitude_q_col.insert_one(data)
        return jsonify({"message": "Question added"}), 201

    qs = list(aptitude_q_col.find())
    for q in qs:
        q["_id"] = str(q["_id"])
    return jsonify(qs)

@app.route("/api/tests/submit", methods=["POST"])
def submit_exam():
    data = request.json or {}
    answers = data.get("answers", {})
    email = data.get("student_email", "")

    all_qs = list(aptitude_q_col.find())
    score = 0
    total = len(all_qs)
    weak_topics = []

    for q in all_qs:
        qid = str(q["_id"])
        chosen = answers.get(qid)
        correct = q.get("correct_answer")
        if chosen == correct:
            score += 1
        elif chosen is not None:
            weak_topics.append(q.get("topic", "General"))

    accuracy = round((score / total * 100), 2) if total > 0 else 0
    attempt = {
        "student_email": email,
        "score": score,
        "total": total,
        "accuracy": accuracy,
        "weak_topics": list(set(weak_topics)),
        "submitted_at": datetime.datetime.utcnow()
    }
    attempts_col.insert_one(attempt)
    return jsonify(attempt), 200

# --- ADMIN DASHBOARD ANALYTICS ---
@app.route("/api/admin/stats", methods=["GET"])
def admin_stats():
    return jsonify({
        "total_students": users_col.count_documents({"role": "student"}),
        "total_notes": notes_col.count_documents({}),
        "total_syllabus": syllabus_col.count_documents({}),
        "total_pyqs": pyq_col.count_documents({}),
        "total_questions": aptitude_q_col.count_documents({}),
        "total_test_attempts": attempts_col.count_documents({})
    })

@app.route("/api/admin/students", methods=["GET"])
def admin_student_list():
    students = list(users_col.find({"role": "student"}, {"password_hash": 0}))
    for s in students:
        s["_id"] = str(s["_id"])
        # Fetch last attempt
        last = attempts_col.find_one({"student_email": s["email"]}, sort=[("submitted_at", -1)])
        s["last_score"] = f"{last['score']}/{last['total']}" if last else "Not Attempted"
        s["accuracy"] = f"{last['accuracy']}%" if last else "N/A"
    return jsonify(students)

if __name__ == "__main__":
    app.run(port=5000, debug=False, use_reloader=False)