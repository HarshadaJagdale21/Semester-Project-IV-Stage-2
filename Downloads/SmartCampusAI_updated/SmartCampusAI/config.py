import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Data paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset")
SYLLABUS_PATH = os.path.join(DATASET_PATH, "syllabus")
PAPERS_PATH = os.path.join(DATASET_PATH, "papers")
NOTES_PATH = os.path.join(DATASET_PATH, "notes")
BOOKS_PATH = os.path.join(DATASET_PATH, "books")
APTITUDE_PATH = os.path.join(DATASET_PATH, "aptitude")
PROJECTS_PATH = os.path.join(DATASET_PATH, "projects")

# College Info
COLLEGE_NAME = "R. C. Patel Institute of Technology"
COLLEGE_SHORT = "RCPIT"
PLATFORM_NAME = "StudyMate"

# Branch definitions
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

# Year/Semester mapping
YEARS = {
    "FY": {"name": "First Year", "semesters": ["Sem 1", "Sem 2"]},
    "SY": {"name": "Second Year", "semesters": ["Sem 3", "Sem 4"]},
    "TY": {"name": "Third Year", "semesters": ["Sem 5", "Sem 6"]},
    "BE": {"name": "Final Year", "semesters": ["Sem 7", "Sem 8"]},
}
