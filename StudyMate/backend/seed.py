from pymongo import MongoClient
from werkzeug.security import generate_password_hash
import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["studymate_rcpit"]

# Clean old records
db.users.delete_many({})
db.aptitude_questions.delete_many({})
db.notes.delete_many({})
db.syllabus.delete_many({})
db.question_papers.delete_many({})

# 1. Accounts
db.users.insert_many([
    {
        "name": "Prof. Administrator",
        "email": "admin@rcpit.ac.in",
        "password_hash": generate_password_hash("Admin@Rcpit2026"),
        "role": "admin",
        "department": "Computer Engineering & AI",
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
        "enrollment_number": "RCPIT-AIML-2026-042",
        "created_at": datetime.datetime.utcnow()
    }
])

# 2. Academic Notes
db.notes.insert_many([
    {
        "title": "Unit 1: Supervised vs Unsupervised Learning",
        "subject": "Machine Learning",
        "semester": "Semester 5",
        "branch": "AIML",
        "content": "Supervised learning uses labeled datasets to train algorithms for classification and regression. Unsupervised learning identifies hidden patterns in unlabeled data using clustering (e.g., K-Means) and dimensionality reduction (e.g., PCA).",
        "created_at": datetime.datetime.utcnow()
    },
    {
        "title": "Unit 2: Normalization and Functional Dependencies",
        "subject": "Database Management Systems",
        "semester": "Semester 5",
        "branch": "AIML",
        "content": "1NF eliminates repeating groups. 2NF removes partial dependency where non-prime attributes must depend entirely on candidate keys. 3NF eliminates transitive dependencies. BCNF is a stricter version where for every X -> Y, X must be a super key.",
        "created_at": datetime.datetime.utcnow()
    },
    {
        "title": "Unit 3: Asymptotic Analysis & Sorting Algorithms",
        "subject": "Design and Analysis of Algorithms",
        "semester": "Semester 5",
        "branch": "AIML",
        "content": "QuickSort uses divide-and-conquer with an average complexity of O(N log N) and worst-case O(N^2). MergeSort guarantees O(N log N) time complexity with O(N) auxiliary memory.",
        "created_at": datetime.datetime.utcnow()
    }
])

# 3. Previous Year Question Papers (PYQs)
db.question_papers.insert_many([
    {
        "title": "End Semester Exam Dec 2025 - Machine Learning",
        "subject": "Machine Learning",
        "year": "2025",
        "semester": "Semester 5",
        "exam_type": "Regular End-Sem",
        "created_at": datetime.datetime.utcnow()
    },
    {
        "title": "End Semester Exam May 2025 - DBMS",
        "subject": "Database Management Systems",
        "year": "2025",
        "semester": "Semester 4",
        "exam_type": "Regular End-Sem",
        "created_at": datetime.datetime.utcnow()
    }
])

# 4. Placement Aptitude Questions
db.aptitude_questions.insert_many([
    {
        "category": "Quantitative Aptitude",
        "topic": "Percentages",
        "question": "If 20% of a number is 50, what is 60% of that number?",
        "options": ["100", "150", "200", "250"],
        "correct_answer": "150",
        "explanation": "If 20% = 50, then 100% = 250. 60% of 250 = 150."
    },
    {
        "category": "Quantitative Aptitude",
        "topic": "Time and Work",
        "question": "A can finish work in 10 days, B in 15 days. Together they finish in how many days?",
        "options": ["5 days", "6 days", "8 days", "9 days"],
        "correct_answer": "6 days",
        "explanation": "1/10 + 1/15 = 5/30 = 1/6. Total = 6 days."
    },
    {
        "category": "Logical Reasoning",
        "topic": "Coding-Decoding",
        "question": "In a certain code, COMPUTER is written as RFUVQNPC. How is MEDICINE written?",
        "options": ["EOJDJEFM", "EOJDEJFM", "MFEJDJOE", "EOJDJEFN"],
        "correct_answer": "EOJDJEFM",
        "explanation": "Reverse the word and shift intermediate letters by +1."
    },
    {
        "category": "Technical Aptitude",
        "topic": "Data Structures",
        "question": "What is the worst-case time complexity of QuickSort?",
        "options": ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
        "correct_answer": "O(N^2)",
        "explanation": "Occurs when the chosen pivot is always the smallest or largest element."
    },
    {
        "category": "Technical Aptitude",
        "topic": "DBMS",
        "question": "Which normal form removes partial dependency?",
        "options": ["1NF", "2NF", "3NF", "BCNF"],
        "correct_answer": "2NF",
        "explanation": "2NF enforces that no non-prime attribute is functionally dependent on a part of any candidate key."
    }
])

print("StudyMate knowledge base seeded with Admin, Student, Notes, PYQs, and Questions.")