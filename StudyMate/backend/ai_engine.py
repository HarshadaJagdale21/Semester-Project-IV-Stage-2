import os
import json
import requests
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")

# Configure Gemini if key is provided
gemini_model = None
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception as e:
        print("[Gemini Init Error]:", e)

def query_llm(prompt, system_instruction="You are an engineering professor at RCPIT, Shirpur."):
    """Dispatches to Gemini API if configured; otherwise falls back to local Ollama."""
    if gemini_model:
        try:
            full_prompt = f"{system_instruction}\n\nTask:\n{prompt}"
            response = gemini_model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            print("[Gemini Call Failed, falling back to Ollama]:", e)

    # Local Ollama fallback
    try:
        res = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3.2:latest",
                "prompt": f"{system_instruction}\n\nTask:\n{prompt}",
                "stream": False,
                "options": {
                    "num_predict": 500,
                    "temperature": 0.2
                }
            },
            timeout=120
        )
        if res.status_code == 200:
            return res.json().get("response", "").strip()
    except Exception as e:
        print("[Ollama Connection Error]:", e)

    return "AI Engine is currently unreachable. Ensure local Ollama or GEMINI_API_KEY is configured."

# --- RAG RETRIEVAL PIPELINE ---
def retrieve_relevant_context(query, documents, top_k=2):
    """Computes TF-IDF cosine similarity across stored notes/syllabus texts."""
    if not documents:
        return ""
    
    corpus = [d.get("content", "") + " " + d.get("title", "") for d in documents]
    if not any(t.strip() for t in corpus):
        return ""

    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = vectorizer.transform([query])
        scores = cosine_similarity(query_vec, tfidf_matrix).flatten()
        top_indices = scores.argsort()[-top_k:][::-1]
        
        retrieved_texts = []
        for idx in top_indices:
            if scores[idx] > 0.05:  # Relevance threshold
                retrieved_texts.append(f"[{documents[idx].get('title', 'Ref')}]: {documents[idx].get('content', '')}")
        return "\n\n".join(retrieved_texts)
    except Exception:
        return ""

# --- AGENT 1: DOUBT SOLVER AGENT ---
def run_doubt_solver(question, subject, mode, repository_notes):
    grounded_context = retrieve_relevant_context(question, repository_notes)
    grounding_source = "RCPIT College Repository Notes" if grounded_context else "General Engineering Knowledge"

    prompt = """Subject: {subject}
Response Mode: {mode}
Student Question: {question}

Context from Uploaded Department Materials:
{grounded_context if grounded_context else 'No specific department notes found. Base your explanation on standard engineering principles.'}

Structure your answer with:
### 1. Direct Solution
### 2. Core Technical Concepts / Formulas
### 3. Concrete Example
### 4. Exam / Viva Tip
"""
    answer = query_llm(prompt, system_instruction=f"You are the StudyMate AI Academic Doubt Solver for {subject} at RCPIT.")
    return {"answer": answer, "grounding": grounding_source, "context_used": bool(grounded_context)}

# --- AGENT 2: STUDY PLANNER AGENT ---
def run_study_planner(subject, branch, days, hours_per_day, weak_topics):
    weak_str = ", ".join(weak_topics) if weak_topics else f"Core modules of {subject}"
    
    prompt = """Create a strict {days}-day study plan exclusively for the engineering subject '{subject}' for the {branch} department.
DO NOT include topics from any other subject.
Priority weak areas: {weak_str}.
Study hours available per day: {hours_per_day} hours.

Return ONLY a valid JSON array of objects. Do not wrap with backticks or preamble:
[
  {{"day": 1, "topic": f"Exact topic from {subject}", "hours": {hours_per_day}, "tasks": ["Read concept", "Practice 2 numericals", "Review summary"]}}
]
"""
    raw = query_llm(prompt, system_instruction=f"You are the StudyMate Academic Curriculum Planner locked strictly to {subject}.")
    try:
        start = raw.find('[')
        end = raw.rfind(']') + 1
        plan = json.loads(raw[start:end])
    except Exception:
        plan = [
            {"day": i + 1, "topic": f"{subject} - Module {i + 1} Deep Dive", "hours": hours_per_day, "tasks": ["Read textbook unit", "Review class slides", "Solve 3 PYQs"]}
            for i in range(days)
        ]
    return plan

# --- AGENT 3: TEST GENERATOR AGENT ---
def run_test_generator(subject, difficulty, count):
    prompt = """Generate {count} MCQs strictly for '{subject}' at difficulty level '{difficulty}'.
Return ONLY a valid JSON array of objects:
[
  {{
    "question": "Clear technical question?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "Exact string of correct choice",
    "explanation": "Why this answer is correct."
  }}
]
"""
    raw = query_llm(prompt, system_instruction="You are the StudyMate Exam Test Generator. Return ONLY a JSON array.")
    try:
        start = raw.find('[')
        end = raw.rfind(']') + 1
        return json.loads(raw[start:end])
    except Exception:
        return [
            {
                "question": f"Core fundamental principle of {subject}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A",
                "explanation": "Standard textbook foundational principle."
            }
        ]

# --- AGENT 4: RECOMMENDATION AGENT ---
def run_recommendation_agent(weak_topics, subject="Engineering"):
    recs = []
    if weak_topics:
        for t in weak_topics:
            recs.append({
                "topic": t,
                "action": f"Read Unit notes for {t} and take a 5-question targeted quiz.",
                "priority": "High",
                "resource_type": "Notes & Practice"
            })
    else:
        recs.append({
            "topic": f"{subject} End-Sem Prep",
            "action": "Consistent performance detected. Proceed to solve 2025 Previous Year Question Papers.",
            "priority": "Normal",
            "resource_type": "PYQs"
        })
    return recs