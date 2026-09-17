from pymongo import MongoClient
from werkzeug.security import generate_password_hash
import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["studymate_rcpit"]

db.users.delete_many({})
db.aptitude_questions.delete_many({})

db.users.insert_many([
    {
        "name": "Prof. Administrator",
        "email": "admin@rcpit.ac.in",
        "password_hash": generate_password_hash("Admin@Rcpit2026"),
        "role": "admin",
        "created_at": datetime.datetime.utcnow()
    },
    {
        "name": "Rahul Patil",
        "email": "student.aiml@rcpit.ac.in",
        "password_hash": generate_password_hash("Student@2026"),
        "role": "student",
        "branch": "Artificial Intelligence & Machine Learning",
        "year": "Third Year",
        "semester": "Semester 5",
        "created_at": datetime.datetime.utcnow()
    }
])

db.aptitude_questions.insert_many([
    {
        "topic": "Percentages",
        "question": "If 20% of a number is 50, what is 60% of that number?",
        "options": ["100", "150", "200", "250"],
        "correct_answer": "150"
    },
    {
        "topic": "Time & Work",
        "question": "A can finish work in 10 days, B in 15 days. Together they take how many days?",
        "options": ["5 days", "6 days", "8 days", "9 days"],
        "correct_answer": "6 days"
    },
    {
        "topic": "Data Structures",
        "question": "What is the worst-case time complexity of QuickSort?",
        "options": ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
        "correct_answer": "O(N^2)"
    }
])

print("SUCCESS: Admin, Student, and Questions inserted into MongoDB!")