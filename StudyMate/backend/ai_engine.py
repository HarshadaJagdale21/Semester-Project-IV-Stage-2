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
        # Use gemini-1.5-flash which is universally supported
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        print("[AI Engine] Successfully connected to Gemini API.")
    except Exception as e:
        print("[AI Engine] Gemini initialization error:", e)

def query_llm(prompt, system_instruction="You are an expert engineering professor at R. C. Patel Institute of Technology (RCPIT), Shirpur.", json_mode=False, num_predict=2500, temperature=0.2):
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
        payload = {
            "model": "llama3.2:latest",
            "prompt": f"{system_instruction}\n\nTask:\n{prompt}",
            "stream": False,
            "options": {
                "num_predict": num_predict,
                "temperature": temperature
            }
        }
        if json_mode:
            payload["format"] = "json"
            
        res = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=300
        )
        if res.status_code == 200:
            return res.json().get("response", "").strip()
        else:
            print(f"[AI Engine] Ollama HTTP error: {res.status_code} - {res.text}")
    except Exception as e:
        print("[AI Engine] Ollama connection error:", e)
        with open("ollama_debug.txt", "w") as f:
            f.write(f"Gemini Error: fallback\nOllama Error: {str(e)}")

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

    prompt = f"""You are the StudyMate Academic AI Doubt Solver for engineering branches.

### Instructions:
1. You must answer the Student's Question comprehensively using your broad general engineering knowledge.
2. We have provided some "Optional Notes" below. If these notes contain the answer to the question, use them. 
3. IMPORTANT: If the notes are NOT about the specific question asked, IGNORE THEM ENTIRELY. Do not summarize the notes. ONLY answer the student's question.

### Optional Notes (Ignore if irrelevant to the question):
{grounded_context if grounded_context else 'No custom notes available for this topic.'}

### Output Format Requirements:
Provide your response in structured Markdown format exactly like this:
### 1. Direct Summary
A crisp, direct explanation of the answer to the student's question.
### 2. Key Concepts & Formulas
Bullet points with formulas or architectural steps.
### 3. Concrete Example
A practical real-world or programming code snippet.
### 4. Exam & Viva Tip
A high-probability viva question.

### Student Question (ANSWER THIS EXACT QUESTION):
{question}
"""
    answer = query_llm(prompt, system_instruction=f"You are an academic specialist for {subject} at RCPIT.")
    return {"answer": answer, "grounding": grounding_source, "context_used": bool(grounded_context)}

# --- AGENT 2: SUBJECT STUDY PLANNER AGENT ---
def run_study_planner(subject, branch, days, hours_per_day, weak_topics):
    weak_str = ", ".join(weak_topics) if weak_topics else f"Core high-weightage topics of {subject}"
    
    prompt = f"""Generate a highly detailed, step-by-step {days}-day engineering study timetable for '{subject}' ({branch} department).
STRICT RULE: Focus ONLY on topics belonging to f'{subject}'. Do NOT include unrelated engineering subjects.
Student's weak areas needing revision: {weak_str}.
Daily study allocation: {hours_per_day} hours/day.

Return ONLY a valid JSON object with a single key "plan" containing an array of objects. No intro text, no markdown fences. Use this exact schema:
{{
  "plan": [
    {{
      "day": 1, 
      "module": "Which specific module (e.g., Module 1: Basics)",
      "topic": "Exact topic name to learn today", 
      "hours": {hours_per_day}, 
      "advice": "Expert step-by-step advice on HOW to study this topic today, what to focus on, and why.",
      "tasks": ["Detailed step 1", "Detailed step 2", "Detailed step 3"]
    }}
  ]
}}
"""
    raw = query_llm(prompt, system_instruction=f"You are a syllabus coordinator for {subject}. Output valid JSON only.", json_mode=True)
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        
        data = json.loads(cleaned.strip())
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            if 'plan' in data and isinstance(data['plan'], list):
                return data['plan']
            if 'day' in data and 'topic' in data:
                return [data]
        raise ValueError("JSON parsed successfully but format did not match expected structure.")
    except Exception as e:
        print(f"[AI Engine] Error parsing JSON from study planner: {e}")
        print(f"[AI Engine] Raw Output was: {raw}")
        # Fallback syllabus-aligned structure
        return [
            {
                "day": i + 1, 
                "module": f"Module {i + 1}",
                "topic": f"Foundational Concepts & Applications of {subject}", 
                "hours": hours_per_day,
                "advice": f"Focus on understanding the core theoretical principles of {subject} before attempting complex derivations.",
                "tasks": ["Review textbook unit", "Practice numerical problems", "Solve 2025 End-Sem PYQs"]
            }
            for i in range(days)
        ]

# --- AGENT 3: TEST GENERATOR AGENT ---
def run_test_generator(subject, difficulty, count):
    prompt = f"""Generate {count} multiple choice questions (MCQs) for the engineering subject '{subject}' at '{difficulty}' difficulty.
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
    raw = query_llm(prompt, system_instruction=f"You are an exam evaluator for {subject}. Return JSON only.", json_mode=True)
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

# --- AGENT 3.5: CAMPUS APTITUDE TRAINER ---
def run_aptitude_generator(category, topic, count, difficulty, context=""):
    context_str = f"Use the following uploaded reference material to generate the questions:\n{context}\n\n" if context else ""
    
    all_questions = []
    remaining = count
    
    while remaining > 0:
        batch_size = min(remaining, 5) # Process in batches of 5 to avoid Ollama timeouts
        prompt = f"""Generate exactly {batch_size} UNIQUE and DIFFERENT multiple choice questions (MCQs) for Campus Placement Aptitude.
{context_str}Category: '{category}' (e.g. Quantitative, Logical, Verbal, Technical)
Topic: '{topic}'
Difficulty: '{difficulty}'

CRITICAL INSTRUCTIONS:
1. Do NOT copy the example placeholder text. You must GENERATE REAL, CREATIVE, and DIVERSE questions related to the Topic!
2. Do NOT repeat the same question twice.
3. Every question must have exactly 4 different options.
4. Provide a detailed, step-by-step mathematical or logical explanation for each question.

Return ONLY a valid JSON object with a single key "questions" containing an array of objects. No intro text, no markdown fences. Use this exact schema format:
{{
  "questions": [
    {{
      "question": "WRITE YOUR REAL GENERATED QUESTION HERE",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Exact string of the correct option",
      "explanation": "Detailed step-by-step explanation here"
    }}
  ]
}}
"""
        raw = query_llm(prompt, system_instruction=f"You are a top-tier Campus Placement Aptitude Trainer. Output valid JSON only.", json_mode=True, num_predict=2000, temperature=0.8)
        try:
            data = json.loads(raw if raw else "{}")
            if isinstance(data, list):
                all_questions.extend(data)
            elif isinstance(data, dict) and 'questions' in data and isinstance(data['questions'], list):
                all_questions.extend(data['questions'])
            else:
                raise ValueError("JSON format did not match expected structure.")
        except Exception as e:
            print(f"[AI Engine] Error parsing JSON from aptitude generator: {e}")
            safe_raw = str(raw).encode('utf-8', 'replace').decode('utf-8')
            print(f"[AI Engine] Raw Output was: {safe_raw}")
            all_questions.append({
                "question": f"What is a fundamental concept of {topic}? (Fallback)",
                "options": ["Concept A", "Concept B", "Concept C", "Concept D"],
                "correct_answer": "Concept A",
                "explanation": "Fallback generated placeholder due to parsing failure."
            })
        
        remaining -= batch_size

    return all_questions[:count]

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