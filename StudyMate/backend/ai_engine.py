import os
import json
import requests
from dotenv import load_dotenv

# Force load .env from current folder
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6KcrDf5pjyNcSIIxiQptWgsd0GPiPQyFJadP_6dcV2sBg").strip()
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")

# 1. Setup Gemini Client if key exists
gemini_model = None
if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        # Use gemini-1.5-flash or gemini-2.0-flash
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        print("[AI Engine] Successfully connected to Gemini API.")
    except Exception as e:
        print("[AI Engine] Gemini initialization error:", e)

def query_llm(prompt, system_instruction="You are an expert engineering professor at R. C. Patel Institute of Technology (RCPIT), Shirpur."):
    """Dispatches to Gemini API if active; otherwise uses local Ollama."""
    # Attempt 1: Gemini API
    if gemini_model:
        try:
            full_prompt = f"System Instruction: {system_instruction}\n\nTask:\n{prompt}"
            response = gemini_model.generate_content(full_prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            print("[AI Engine] Gemini generation failed, falling back to Ollama:", e)

    # Attempt 2: Local Ollama
    try:
        res = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3.2:latest",
                "prompt": f"{system_instruction}\n\nTask:\n{prompt}",
                "stream": False,
                "options": {
                    "num_predict": 600,
                    "temperature": 0.2
                }
            },
            timeout=90
        )
        if res.status_code == 200:
            return res.json().get("response", "").strip()
        else:
            print(f"[AI Engine] Ollama HTTP error: {res.status_code} - {res.text}")
    except Exception as e:
        print("[AI Engine] Ollama connection error:", e)

    return "⚠️ AI engine could not connect to Gemini API or local Ollama. Please check your terminal for details."

# --- AGENT 1: RAG DOUBT SOLVER AGENT ---
def run_doubt_solver(question, subject, mode, repository_notes):
    # Context extraction from notes
    matched_texts = []
    for n in repository_notes:
        if subject.lower() in n.get("subject", "").lower() or subject.lower() in n.get("title", "").lower():
            matched_texts.append(f"Unit Note [{n.get('title')}]: {n.get('content')}")
    
    grounded_context = "\n\n".join(matched_texts[:3])
    grounding_source = "RCPIT College Repository Notes" if grounded_context else "Standard Engineering Curriculum"

    prompt = """You are the StudyMate Academic AI Doubt Solver for engineering students at RCPIT Shirpur.
Subject: {subject}
Response Style: {mode}

Official Department Notes Available:
{grounded_context if grounded_context else 'No custom lecture notes uploaded yet. Base your authoritative answer on standard university curriculum.'}

Student Question:
{question}

Provide your response in structured Markdown format:
### 1. Direct Summary
A crisp, direct explanation of the answer.

### 2. Key Concepts & Formulas
Bullet points with mathematical formulas, architectural steps, or time/space complexities where relevant.

### 3. Concrete Example
A practical real-world or programming code snippet illustrating the concept.

### 4. Exam & Viva Tip
A high-probability question or keyword examiners look for during viva.
"""
    answer = query_llm(prompt, system_instruction=f"You are an academic specialist for {subject} at RCPIT.")
    return {"answer": answer, "grounding": grounding_source, "context_used": bool(grounded_context)}

# --- AGENT 2: SUBJECT STUDY PLANNER AGENT ---
def run_study_planner(subject, branch, days, hours_per_day, weak_topics):
    weak_str = ", ".join(weak_topics) if weak_topics else f"Core high-weightage topics of {subject}"
    
    prompt = """Generate a comprehensive, subject-specific {days}-day engineering study timetable for '{subject}' ({branch} department).
STRICT RULE: Focus ONLY on topics belonging to f'{subject}'. Do NOT include unrelated engineering subjects.
Student's weak areas needing revision: {weak_str}.
Daily study allocation: {hours_per_day} hours/day.

Return ONLY a valid JSON array of objects. No intro text, no markdown fences:
[
  {{"day": 1, "topic": f"Exact topic name from {subject}", "hours": {hours_per_day}, "tasks": ["Read concept & derivation", "Solve 3 PYQs", "Summarize formulas"]}}
]
"""
    raw = query_llm(prompt, system_instruction=f"You are a syllabus coordinator for {subject}. Output valid JSON only.")
    try:
        start = raw.find('[')
        end = raw.rfind(']') + 1
        return json.loads(raw[start:end])
    except Exception:
        # Fallback syllabus-aligned structure
        return [
            {"day": i + 1, "topic": f"{subject} - Module {i + 1}: Foundational Concepts & Applications", "hours": hours_per_day, "tasks": ["Review textbook unit", "Practice numerical problems", "Solve 2025 End-Sem PYQs"]}
            for i in range(days)
        ]

# --- AGENT 3: TEST GENERATOR AGENT ---
def run_test_generator(subject, difficulty, count):
    prompt = """Generate {count} multiple choice questions (MCQs) for the engineering subject '{subject}' at '{difficulty}' difficulty.
Return ONLY a valid JSON array:
[
  {{
    "question": "Technical question text",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "Exact string of one option",
    "explanation": "Detailed explanation why this answer is correct"
  }}
]
"""
    raw = query_llm(prompt, system_instruction=f"You are an exam evaluator for {subject}. Return JSON only.")
    try:
        start = raw.find('[')
        end = raw.rfind(']') + 1
        return json.loads(raw[start:end])
    except Exception:
        return [
            {
                "question": f"Which of the following is a primary characteristic of {subject}?",
                "options": ["High computational throughput", "Deterministic convergence", "Heuristic optimization", "Polynomial verification"],
                "correct_answer": "Deterministic convergence",
                "explanation": f"Foundational textbook property of {subject}."
            }
        ]

# --- AGENT 4: RECOMMENDATION AGENT ---
def run_recommendation_agent(weak_topics, subject="Engineering"):
    recs = []
    if weak_topics:
        for t in weak_topics:
            recs.append({
                "topic": t,
                "action": f"Review Unit lecture notes for '{t}' and solve 5 targeted mock test questions.",
                "priority": "High",
                "resource_type": "Notes & PYQ"
            })
    else:
        recs.append({
            "topic": f"{subject} End-Sem Prep",
            "action": "Consistent performance! Advance to solving previous year exam papers.",
            "priority": "Normal",
            "resource_type": "PYQs"
        })
    return recs