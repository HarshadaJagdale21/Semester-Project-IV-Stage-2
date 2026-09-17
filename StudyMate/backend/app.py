import os
import datetime
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client["studymate_rcpit"]
users_col = db["users"]
notes_col = db["notes"]
questions_col = db["aptitude_questions"]
attempts_col = db["test_attempts"]

JWT_SECRET = "rcpit_secret_2026"

def ask_ollama(prompt, system="You are an expert engineering professor at RCPIT, Shirpur."):
    try:
        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3:8b",
                "prompt": f"{system}\n\nQuestion: {prompt}",
                "stream": False
            },
            timeout=90
        )
        if res.status_code == 200:
            return res.json().get("response", "").strip()
    except Exception as e:
        print("Ollama error:", e)
    return "Ollama is busy or loading. Please make sure Ollama is open and try again."

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
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=3)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "branch": user.get("branch", "AIML")
        }
    }), 200

@app.route("/api/ai/doubt", methods=["POST"])
def solve_doubt():
    data = request.json or {}
    question = data.get("question", "")
    subject = data.get("subject", "General")
    
    answer = ask_ollama(f"Subject: {subject}. Solve this academic doubt clearly with steps: {question}")
    return jsonify({"answer": answer, "subject": subject})

@app.route("/api/aptitude/questions", methods=["GET"])
def get_questions():
    qs = list(questions_col.find())
    for q in qs:
        q["_id"] = str(q["_id"])
    return jsonify(qs)

@app.route("/api/tests/submit", methods=["POST"])
def submit_test():
    data = request.json or {}
    answers = data.get("answers", {})
    email = data.get("student_email", "")

    score = 0
    all_qs = list(questions_col.find())
    for q in all_qs:
        qid = str(q["_id"])
        if answers.get(qid) == q.get("correct_answer"):
            score += 1

    total = len(all_qs)
    accuracy = round((score / total * 100), 2) if total > 0 else 0
    
    result = {
        "student_email": email,
        "score": score,
        "total": total,
        "accuracy": accuracy,
        "date": datetime.datetime.utcnow()
    }
    attempts_col.insert_one(result)
    return jsonify({"score": score, "total": total, "accuracy": accuracy})

@app.route("/api/notes", methods=["POST"])
def upload_note():
    data = request.json or {}
    notes_col.insert_one({
        "title": data.get("title"),
        "subject": data.get("subject"),
        "content": data.get("content"),
        "uploaded_at": datetime.datetime.utcnow()
    })
    return jsonify({"message": "Note uploaded successfully"}), 201

if __name__ == "__main__":
    app.run(port=5000, debug=True)