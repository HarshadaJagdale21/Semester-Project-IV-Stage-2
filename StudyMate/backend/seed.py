from pymongo import MongoClient
from werkzeug.security import generate_password_hash
import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["studymate_rcpit"]

# Clear existing
db.users.delete_many({})
db.aptitude_questions.delete_many({})
db.notes.delete_many({})
db.syllabus.delete_many({})
db.question_papers.delete_many({})
db.projects.delete_many({})
db.books.delete_many({})

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
        "branch": "AIML",
        "year": "2024",
        "semester": "Semester 5",
        "enrollment_number": "RCPIT-AIML-2026-042",
        "created_at": datetime.datetime.utcnow()
    }
])

# 2. Curated Academic Notes
db.notes.insert_many([
    {
        "title": "Unit 1: Supervised vs Unsupervised Learning & Loss Functions",
        "subject": "Machine Learning",
        "semester": "Semester 5",
        "branch": "AIML",
        "unit": "Unit 1",
        "content": "Supervised learning trains on labeled inputs (regression, classification). Cost functions like Mean Squared Error (MSE) and Cross-Entropy measure prediction loss. Gradient Descent iteratively adjusts weights to minimize loss.",
        "created_at": datetime.datetime.utcnow()
    },
    {
        "title": "Unit 2: Relational Normalization (1NF, 2NF, 3NF, BCNF)",
        "subject": "Database Systems",
        "semester": "Semester 5",
        "branch": "AIML",
        "unit": "Unit 2",
        "content": "1NF eliminates repeating groups. 2NF removes partial dependency. 3NF eliminates transitive dependencies. Boyce-Codd Normal Form (BCNF) strictly requires that for every non-trivial functional dependency X -> Y, X must be a candidate key.",
        "created_at": datetime.datetime.utcnow()
    },
    {
        "title": "Unit 3: Asymptotic Analysis & Master Theorem",
        "subject": "Algorithms & DAA",
        "semester": "Semester 5",
        "branch": "AIML",
        "unit": "Unit 3",
        "content": "Master Theorem provides direct solutions for recurrences of the form T(n) = aT(n/b) + f(n). QuickSort achieves average O(N log N) time and worst-case O(N^2). MergeSort guarantees O(N log N) with O(N) extra space.",
        "created_at": datetime.datetime.utcnow()
    }
])

# 3. PYQs
db.question_papers.insert_many([
    {
        "title": "End-Semester Dec 2025 - Machine Learning",
        "subject": "Machine Learning",
        "year": "2025",
        "semester": "Semester 5",
        "branch": "AIML",
        "exam_type": "Regular End-Sem",
        "created_at": datetime.datetime.utcnow()
    },
    {
        "title": "End-Semester May 2025 - Database Management Systems",
        "subject": "Database Systems",
        "year": "2025",
        "semester": "Semester 4",
        "branch": "AIML",
        "exam_type": "Regular End-Sem",
        "created_at": datetime.datetime.utcnow()
    }
])

# 4. Placement Aptitude Question Bank
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
        "question": "Pipe A can fill a tank in 4 hours, and Pipe B can empty it in 6 hours. If both are opened together, in how many hours will the tank fill?",
        "options": ["10 hours", "12 hours", "8 hours", "14 hours"],
        "correct_answer": "12 hours",
        "explanation": "Net rate = (1/4 - 1/6) = 1/12 per hour. Time = 12 hours."
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
        "topic": "QuickSort Complexity",
        "question": "What is the worst-case time complexity of QuickSort?",
        "options": ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
        "correct_answer": "O(N^2)",
        "explanation": "Occurs when the selected pivot is consistently the maximum or minimum element."
    },
    {
        "category": "Technical Aptitude",
        "topic": "Normalization",
        "question": "Which normal form removes transitive dependencies?",
        "options": ["1NF", "2NF", "3NF", "BCNF"],
        "correct_answer": "3NF",
        "explanation": "3NF enforces that no non-prime attribute depends transitively on a primary key."
    }
])

# 5. Capstone Project Ideas
db.projects.insert_many([
    {
        "title": "StudyMate: Multi-Agent Academic Assistance System",
        "domain": "Artificial Intelligence & Full-Stack",
        "difficulty": "Final Year",
        "abstract": "An autonomous multi-agent academic ecosystem integrating local LLMs, RAG-grounded syllabus retrieval, and performance analytics for engineering colleges.",
        "technologies": ["React", "Flask", "MongoDB", "Ollama", "Tailwind CSS", "Recharts"],
        "expected_output": "Fully functional responsive portal with AI Doubt Solver, Study Planner, and Admin Controls."
    },
    {
        "title": "Automated Plant Disease Classifier using Vision Transformers",
        "domain": "Computer Vision & Agriculture",
        "difficulty": "Advanced",
        "abstract": "Deep learning system utilizing ViT architecture to diagnose foliar plant diseases from leaf imagery with 96% accuracy.",
        "technologies": ["PyTorch", "OpenCV", "FastAPI", "React Native"],
        "expected_output": "Mobile inference pipeline with disease classification and treatment recommendations."
    }
])

# 6. Recommended Reference Books
db.books.insert_many([
    {
        "title": "Pattern Recognition and Machine Learning",
        "author": "Christopher M. Bishop",
        "subject": "Machine Learning",
        "description": "Comprehensive reference covering Bayesian networks, graphical models, and neural approximations.",
        "recommendation_reason": "Essential for Semester 5 Machine Learning core derivations."
    },
    {
        "title": "Database System Concepts (7th Edition)",
        "author": "Silberschatz, Korth, Sudarshan",
        "subject": "Database Systems",
        "description": "The gold standard textbook for transaction management, indexing, and normal forms.",
        "recommendation_reason": "Directly matches the RCPIT DBMS syllabus units."
    }
])

print("StudyMate database successfully seeded with complete academic dataset.")