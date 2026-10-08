import os
import datetime
import re
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["studymate_rcpit"]

# WIPE OUT MOCK SYLLABUS
db.syllabus.delete_many({})

dataset_path = r"c:\Users\harsh\StudyMate\dataset_unzipped\dataset"

def extract_semesters_from_text(text):
    text_lower = text.lower()
    
    # Try to find specific "sem 1", "sem-2", etc.
    sem_matches = re.findall(r'sem[-_\s]*(\d+)(?:\s*(?:&|and)\s*(\d+))?', text_lower)
    semesters = set()
    
    if sem_matches:
        for match in sem_matches:
            for num in match:
                if num and 1 <= int(num) <= 8:
                    semesters.add(num)
    
    # If no "sem" keyword found but it has numbers, filter numbers 1-8
    if not semesters:
        all_nums = re.findall(r'\b[1-8]\b', text_lower)
        for num in all_nums:
            semesters.add(num)
            
    # Fallback to text
    if not semesters:
        if "first" in text_lower or "1st" in text_lower:
            return ["1", "2"]
        if "second" in text_lower or "2nd" in text_lower:
            return ["3", "4"]
        if "third" in text_lower or "3rd" in text_lower:
            return ["5", "6"]
        if "last" in text_lower or "fourth" in text_lower or "4th" in text_lower:
            return ["7", "8"]
            
    return list(semesters)

def process_pdfs():
    syllabus_dir = os.path.join(dataset_path, "syllabus")
    if not os.path.exists(syllabus_dir):
        print("Syllabus directory not found!")
        return

    count = 0
    # Walk the directory tree to find all PDFs
    for root, _, files in os.walk(syllabus_dir):
        for filename in files:
            if not filename.lower().endswith('.pdf'):
                continue
                
            # Figure out branch and year from the path
            rel_path = os.path.relpath(root, syllabus_dir)
            path_parts = rel_path.split(os.sep)
            
            branch = path_parts[0] if len(path_parts) > 0 else "ALL"
            year = path_parts[1] if len(path_parts) > 1 else "Unknown"
            
            # Extract year from filename if present
            year_match = re.search(r'(20\d{2})', filename)
            if year_match:
                year = year_match.group(1)
            
            text_to_search = rel_path + " " + filename
            semesters = extract_semesters_from_text(text_to_search)
            
            # Create the file URL mapped to our new Flask route
            rel_url_path = os.path.relpath(os.path.join(root, filename), dataset_path).replace('\\', '/')
            file_url = f"/dataset/{rel_url_path}"
            
            if not semesters:
                semesters = ["1"] # Fallback if absolutely nothing is found
                
            for sem_num in semesters:
                sem_str = f"Semester {sem_num}"
                doc = {
                    "title": f"{branch} {sem_str} Official Syllabus ({year})",
                    "content": "Official PDF Syllabus document directly from the RCPIT dataset.",
                    "preview": "Official PDF Syllabus document directly from the RCPIT dataset.",
                    "branch": branch,
                    "semester": sem_str,
                    "subject": f"{branch} Core",
                    "file_type": "PDF",
                    "file_url": file_url,
                    "year": year,
                    "is_real_file": True,
                    "created_at": datetime.datetime.utcnow()
                }
                db.syllabus.insert_one(doc)
                count += 1
                print(f"Inserted: {branch} - {sem_str} ({filename})")

    print(f"Total authentic syllabus PDFs inserted via static URL: {count}")

if __name__ == "__main__":
    process_pdfs()