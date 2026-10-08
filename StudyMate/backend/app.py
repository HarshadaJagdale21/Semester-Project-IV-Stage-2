import os
import io
import datetime
import json
from functools import wraps
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from pypdf import PdfReader
from ai_engine import (
    run_doubt_solver,
    run_study_planner,
    run_test_generator,
    run_recommendation_agent,
    run_aptitude_generator
)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/files/<path:filename>")
def serve_file(filename):
    # Search for the file recursively in dataset_unzipped
    dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dataset_unzipped", "dataset"))
    for root, dirs, files in os.walk(dataset_dir):
        for f in files:
            if f == filename:
                return send_file(os.path.join(root, f))
    return jsonify({"error": "File not found"}), 404

import os
# Mount the dataset_unzipped directory statically
dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset_unzipped', 'dataset'))
from flask import send_from_directory

@app.route('/dataset/<path:filename>')
def serve_dataset(filename):
    return send_from_directory(dataset_path, filename)

# MongoDB Configuration
client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
db = client[os.getenv("DB_NAME", "studymate_rcpit")]

# Collections
users_col = db["users"]
syllabus_col = db["syllabus"]
notes_col = db["notes"]
pyq_col = db["question_papers"]
aptitude_q_col = db["aptitude_questions"]
aptitude_materials_col = db["aptitude_materials"]
attempts_col = db["test_attempts"]
study_plans_col = db["study_plans"]
doubts_col = db["doubts"]
projects_col = db["projects"]
books_col = db["books"]
notifications_col = db["notifications"]

JWT_SECRET = os.getenv("JWT_SECRET", "rcpit_super_secret_jwt_key_2026_production_safe_string_32chars")

# --- AUTH DECORATORS ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization token missing"}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid token format"}), 401
        
        token = parts[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = users_col.find_one({"_id": ObjectId(payload["id"])})
            if not current_user:
                return jsonify({"error": "Account no longer exists"}), 401
            current_user["_id"] = str(current_user["_id"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.get("role") != role:
                return jsonify({"error": f"Forbidden: Requires {role} privileges"}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

# --- AUTHENTICATION ---
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip()
    password = data.get("password")

    if not email or not password or not name:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    user = {
        "name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": "student", # Hardcoded for security: Nobody can register as admin
        "branch": data.get("branch", "AIML"),
        "year": data.get("year", "2024"),
        "semester": data.get("semester", "Semester 8"),
        "enrollment_number": data.get("enrollment_number", "RCPIT-2026-STU"),
        "created_at": datetime.datetime.utcnow()
    }
    res = users_col.insert_one(user)
    uid = str(res.inserted_id)

    token = jwt.encode({
        "id": uid, "name": user["name"], "email": user["email"], "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({"token": token, "user": {"id": uid, "name": user["name"], "email": user["email"], "role": user["role"], "branch": user["branch"], "semester": user["semester"]}}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    user = users_col.find_one({"email": email})
    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"error": "Invalid email or password"}), 401

    uid = str(user["_id"])
    token = jwt.encode({
        "id": uid, "name": user["name"], "email": user["email"], "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({"token": token, "user": {"id": uid, "name": user["name"], "email": user["email"], "role": user["role"], "branch": user.get("branch", "AIML"), "year": user.get("year", "2024"), "semester": user.get("semester", "Semester 8")}}), 200

@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    return jsonify({"user": current_user}), 200

@app.route("/api/auth/me", methods=["PUT"])
@token_required
def update_me(current_user):
    data = request.json or {}
    updates = {}
    
    # Allow updating these fields
    allowed_fields = ["name", "prn", "roll_no", "profile_pic", "bio", "phone"]
    for field in allowed_fields:
        if field in data:
            updates[field] = data[field]
            
    if updates:
        from bson.objectid import ObjectId
        users_col.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": updates})
        
        # Refetch updated user
        updated_user = users_col.find_one({"_id": ObjectId(current_user["_id"])})
        updated_user["_id"] = str(updated_user["_id"])
        return jsonify({"user": updated_user, "message": "Profile updated successfully"}), 200
        
    return jsonify({"message": "No changes made"}), 200

# --- STUDENT DASHBOARD STATS ---
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
        performance_history = [{"date": "Baseline", "accuracy": 65, "score": 3}]

    # Dynamic count of real uploaded resources
    total_db_notes = notes_col.count_documents({})
    distinct_subs = notes_col.distinct("subject")
    
    subjects_tracked = [
        {"subject": s, "progress": 75, "units_completed": 4, "total_units": 6}
        for s in distinct_subs[:4]
    ] if distinct_subs else [
        {"subject": "Deep Learning", "progress": 80, "units_completed": 4, "total_units": 6},
        {"subject": "Natural Language Processing", "progress": 65, "units_completed": 3, "total_units": 5},
        {"subject": "Cloud Computing", "progress": 90, "units_completed": 5, "total_units": 5},
        {"subject": "AI Fundamentals", "progress": 70, "units_completed": 3, "total_units": 5}
    ]

    tasks = [
        {"id": 1, "title": "Revise Transformer Architectures & Attention", "subject": "Deep Learning", "due": "Tomorrow", "priority": "High"},
        {"id": 2, "title": "Review TF-IDF and N-gram Tokenization Notes", "subject": "NLP", "due": "In 2 days", "priority": "Medium"},
        {"id": 3, "title": "Attempt QuickSort & Time Complexity Quiz", "subject": "Algorithms", "due": "In 3 days", "priority": "High"}
    ]

    return jsonify({
        "stats": {
            "total_tests": total_tests,
            "avg_accuracy": avg_accuracy,
            "total_subjects": len(subjects_tracked),
            "weak_topics_count": len(weak_topics_set),
            "total_notes": total_db_notes
        },
        "performance_history": performance_history,
        "subject_progress": subjects_tracked,
        "weak_topics": list(weak_topics_set) if weak_topics_set else ["Percentages", "Normalization", "QuickSort Complexity"],
        "tasks": tasks
    }), 200

# --- ACADEMIC RESOURCES (SEARCH & FILTERS ACROSS ALL 279 FILES) ---
@app.route("/api/resources", methods=["GET"])
@token_required
def get_resources(current_user):
    res_type = request.args.get("type", "notes")
    search = request.args.get("search", "").strip()

    branch = request.args.get("branch", "ALL")
    semester = request.args.get("semester", "ALL")
    subject = request.args.get("subject", "ALL")

    if current_user.get("role") == "student":
        # Strictly enforce branch and semester separation for students!
        branch = current_user.get("branch", "AIML")
        semester = current_user.get("semester", "Semester 5")
        student_year = current_user.get("year", "2024")

    col = syllabus_col if res_type == "syllabus" else (pyq_col if res_type == "pyqs" else notes_col)
    query = {}
    
    if current_user.get("role") == "student" and res_type == "syllabus":
        query["year"] = student_year
    
    if branch and branch != "ALL":
        query["$and"] = query.get("$and", []) + [{"$or": [{"branch": {"$regex": f"^{branch}$", "$options": "i"}}, {"branch": "ALL"}]}]
    if semester and semester != "ALL":
        query["$and"] = query.get("$and", []) + [{"$or": [{"semester": {"$regex": f"^{semester}$", "$options": "i"}}, {"semester": "ALL"}]}]
    if subject and subject != "ALL":
        query["subject"] = {"$regex": subject, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"subject": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]

    records = list(col.find(query).sort("created_at", -1).limit(60))
    for r in records:
        r["_id"] = str(r["_id"])
        if "content" in r and len(r["content"]) > 300:
            r["preview"] = r["content"][:300] + "..."
        else:
            r["preview"] = r.get("content", "")

    distinct_subjects = col.distinct("subject")
    
    return jsonify({
        "records": records,
        "total": len(records),
        "available_subjects": distinct_subjects
    }), 200

# --- MULTI-AGENT AI SYSTEM ---
@app.route("/api/ai/doubt", methods=["POST"])
@token_required
def ai_doubt(current_user):
    data = request.json or {}
    question = data.get("question", "").strip()
    subject = data.get("subject", "General Engineering")
    mode = data.get("mode", "Detailed Explanation")

    if not question:
        return jsonify({"error": "Question is required"}), 400

    # Retrieve all matched notes from MongoDB
    notes = list(notes_col.find({"$or": [
        {"subject": {"$regex": subject, "$options": "i"}},
        {"title": {"$regex": subject, "$options": "i"}},
        {"content": {"$regex": question[:15], "$options": "i"}}
    ]}).limit(10))

    result = run_doubt_solver(question, subject, mode, notes)
    
    doubts_col.insert_one({
        "student_email": current_user["email"],
        "question": question,
        "subject": subject,
        "answer": result["answer"],
        "created_at": datetime.datetime.utcnow()
    })
    return jsonify(result), 200

@app.route("/api/ai/study-plan", methods=["POST"])
@token_required
def ai_study_plan(current_user):
    data = request.json or {}
    subject = data.get("subject", "").strip()
    branch = data.get("branch", current_user.get("branch", "AIML"))
    days = int(data.get("days", 5))
    hours = int(data.get("hours_per_day", 3))
    weak_topics = data.get("weak_topics", [])

    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    plan = run_study_planner(subject, branch, days, hours, weak_topics)
    study_plans_col.insert_one({
        "student_email": current_user["email"],
        "subject": subject,
        "branch": branch,
        "days": days,
        "plan": plan,
        "created_at": datetime.datetime.utcnow()
    })
    return jsonify({"plan": plan, "subject": subject, "branch": branch}), 200

@app.route("/api/ai/aptitude", methods=["POST"])
@token_required
def ai_aptitude(current_user):
    data = request.json or {}
    category = data.get("category", "Quantitative Aptitude").strip()
    topic = data.get("topic", "General").strip()
    count = int(data.get("count", 5))
    difficulty = data.get("difficulty", "Medium").strip()

    # Retrieve context from uploaded aptitude materials (RAG)
    materials = list(aptitude_materials_col.find({
        "$or": [
            {"subject": {"$regex": category, "$options": "i"}},
            {"title": {"$regex": topic, "$options": "i"}},
            {"content": {"$regex": topic, "$options": "i"}}
        ]
    }).limit(3))
    
    context = ""
    if materials:
        context = "\n\n".join([m.get("content", "")[:1500] for m in materials])

    questions = run_aptitude_generator(category, topic, count, difficulty, context)
    return jsonify({"questions": questions}), 200

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
    test_qids = data.get("test_question_ids", [])

    all_qs = list(aptitude_q_col.find({"_id": {"$in": [ObjectId(qid) for qid in test_qids]}})) if test_qids else list(aptitude_q_col.find())
    score = 0
    total = len(all_qs) if test_qids else len(answers) # fallback if no test_qids
    if total == 0: total = 1 # prevent division by zero
    
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

    accuracy = round((score / total * 100), 2)
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

# --- PROJECTS & BOOKS ---
@app.route("/api/projects", methods=["GET"])
@token_required
def get_projects(current_user):
    query = {}
    if current_user.get("role") == "student":
        branch = current_user.get("branch", "AIML")
        semester = current_user.get("semester", "Semester 5")
        query = {"branch": branch, "semester": semester}
    
    projects = list(projects_col.find(query))
    for p in projects:
        p["_id"] = str(p["_id"])
    return jsonify(projects), 200

@app.route("/api/books", methods=["GET"])
@token_required
def get_books(current_user):
    # Admins see all books, students see their specific branch and semester
    query = {}
    if current_user.get("role") == "student":
        branch = current_user.get("branch", "AIML")
        semester = current_user.get("semester", "Semester 5")
        query = {"branch": branch, "semester": semester}
    
    books = list(books_col.find(query))
    for b in books:
        b["_id"] = str(b["_id"])
    return jsonify(books), 200

# --- ADMIN DASHBOARD ---
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

@app.route("/api/admin/students", methods=["GET", "POST"])
@token_required
@role_required("admin")
def admin_student_list(current_user):
    if request.method == "POST":
        data = request.json
        # Create new student
        if users_col.find_one({"email": data.get("email")}):
            return jsonify({"error": "Student email already exists"}), 400
        
        from werkzeug.security import generate_password_hash
        import datetime
        new_student = {
            "name": data.get("name"),
            "email": data.get("email"),
            "password_hash": generate_password_hash(data.get("password", "Student@2026")),
            "role": "student",
            "branch": data.get("branch", "AIML"),
            "semester": data.get("semester", "Semester 5"),
            "enrollment_number": data.get("enrollment_number", "UNKNOWN"),
            "created_at": datetime.datetime.utcnow()
        }
        users_col.insert_one(new_student)
        return jsonify({"message": "Student created successfully"}), 201

    students = list(users_col.find({"role": "student"}, {"password_hash": 0}))
    for s in students:
        s["_id"] = str(s["_id"])
        last = attempts_col.find_one({"student_email": s["email"]}, sort=[("submitted_at", -1)])
        s["last_score"] = f"{last['score']}/{last['total']}" if last else "Not Attempted"
        s["accuracy"] = f"{last['accuracy']}%" if last else "N/A"
    return jsonify(students), 200

@app.route("/api/admin/students/<student_id>", methods=["GET", "DELETE"])
@token_required
@role_required("admin")
def admin_manage_student(current_user, student_id):
    try:
        from bson import ObjectId
        obj_id = ObjectId(student_id)
        
        if request.method == "GET":
            student = users_col.find_one({"_id": obj_id, "role": "student"}, {"password_hash": 0})
            if not student:
                return jsonify({"error": "Student not found"}), 404
            
            student["_id"] = str(student["_id"])
            # Get all test attempts
            attempts = list(attempts_col.find({"student_email": student["email"]}).sort("submitted_at", -1))
            for a in attempts:
                a["_id"] = str(a["_id"])
                
            student["attempts"] = attempts
            return jsonify(student), 200
            
        elif request.method == "DELETE":
            res = users_col.delete_one({"_id": obj_id, "role": "student"})
            if res.deleted_count == 1:
                return jsonify({"message": "Student removed successfully"}), 200
            return jsonify({"error": "Student not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/admin/impersonate/<student_id>", methods=["POST"])
@token_required
@role_required("admin")
def impersonate_student(current_user, student_id):
    from bson import ObjectId
    import jwt
    import datetime
    
    student = users_col.find_one({"_id": ObjectId(student_id), "role": "student"})
    if not student:
        return jsonify({"error": "Student not found"}), 404
        
    token = jwt.encode({
        'user_id': str(student['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    student["_id"] = str(student["_id"])
    del student["password_hash"]
    
    return jsonify({"token": token, "user": student}), 200

@app.route("/api/admin/upload", methods=["POST"])
@token_required
@role_required("admin")
def upload_resource(current_user):
    import datetime
    import tempfile
    from pathlib import Path
    import sys
    
    # Import extract_content
    sys.path.append(os.path.dirname(__file__))
    try:
        from import_dataset import extract_content
    except ImportError:
        def extract_content(fp): return "Extracted text content..."

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file.filename)
    file.save(file_path)
    
    content = extract_content(Path(file_path))
    
    title = request.form.get("title", file.filename)
    subject = request.form.get("subject", "General")
    branch = request.form.get("branch", "AIML")
    semester = request.form.get("semester", "Semester 1")
    unit = request.form.get("unit", "Unit 1")
    res_type = request.form.get("type", "notes")
    
    doc = {
        "title": title,
        "file_name": file.filename,
        "branch": branch,
        "semester": semester,
        "subject": subject,
        "unit": unit,
        "content": content,
        "char_count": len(content),
        "file_type": file.filename.split('.')[-1].upper(),
        "created_at": datetime.datetime.utcnow(),
        "uploaded_by": current_user["email"]
    }
    
    if res_type == "syllabus":
        target_collection = syllabus_col
    elif res_type == "aptitude":
        target_collection = aptitude_materials_col
    else:
        target_collection = notes_col
    target_collection.insert_one(doc)
    
    try:
        os.remove(file_path)
    except:
        pass
    
    return jsonify({"message": "File uploaded and indexed successfully"}), 201

@app.route("/api/admin/syllabus/<id>", methods=["PUT"])
@token_required
@role_required("admin")
def update_syllabus(current_user, id):
    from bson.objectid import ObjectId
    data = request.json
    new_content = data.get("content")
    if not new_content:
        return jsonify({"error": "Content is required"}), 400
    
    res = syllabus_col.update_one({"_id": ObjectId(id)}, {"$set": {"content": new_content}})
    if res.matched_count == 0:
        return jsonify({"error": "Syllabus not found"}), 404
    return jsonify({"message": "Syllabus updated successfully"}), 200

@app.route("/api/admin/aptitude", methods=["POST"])
@token_required
@role_required("admin")
def add_aptitude_question(current_user):
    data = request.json
    data["created_at"] = datetime.datetime.utcnow()
    aptitude_q_col.insert_one(data)
    return jsonify({"message": "Question added successfully"}), 201

if __name__ == "__main__":
    app.run(port=5000, debug=True)