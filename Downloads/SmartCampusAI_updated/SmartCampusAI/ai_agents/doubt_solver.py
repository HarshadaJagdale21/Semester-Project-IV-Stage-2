"""
Doubt Solver Agent — RAG-powered academic Q&A chatbot.
Retrieves context from syllabus, notes, and papers to answer student queries.
"""
import os
import glob
from .base_agent import BaseAgent


class DoubtSolverAgent(BaseAgent):
    """Answers academic doubts using RAG (Retrieval-Augmented Generation)."""

    def __init__(self):
        super().__init__()
        self.dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")

    def _search_files(self, query):
        """Simple keyword-based retrieval from dataset files."""
        results = []
        query_terms = query.lower().split()

        # Search through text files in dataset
        for root, dirs, files in os.walk(self.dataset_path):
            for file in files:
                if file.endswith(('.txt', '.md', '.csv')):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            # Check if any query terms appear in the file
                            relevance = sum(1 for term in query_terms if term in content.lower())
                            if relevance > 0:
                                # Get relevant snippet
                                lines = content.split('\n')
                                relevant_lines = []
                                for line in lines:
                                    if any(term in line.lower() for term in query_terms):
                                        relevant_lines.append(line.strip())
                                snippet = '\n'.join(relevant_lines[:10])
                                results.append({
                                    "file": os.path.relpath(filepath, self.dataset_path),
                                    "relevance": relevance,
                                    "snippet": snippet[:500]
                                })
                    except Exception:
                        continue

        # Sort by relevance
        results.sort(key=lambda x: x["relevance"], reverse=True)
        return results[:5]

    def answer(self, question, subject=None, branch=None):
        """Answer a student's doubt using RAG approach."""

        # Step 1: Retrieve relevant context
        context_docs = self._search_files(question)
        context_text = ""
        if context_docs:
            context_text = "\n\nRelevant context from course materials:\n"
            for doc in context_docs:
                context_text += f"\n--- From {doc['file']} ---\n{doc['snippet']}\n"

        # Step 2: Build prompt with context
        subject_info = f" in {subject}" if subject else ""
        branch_info = f" ({branch} branch)" if branch else ""

        prompt = f"""You are StudyMate AI, an expert academic assistant for engineering students at R.C. Patel Institute of Technology{branch_info}.

A student has asked the following question{subject_info}:
"{question}"
{context_text}

Provide a clear, detailed, step-by-step explanation. Include:
1. A direct answer to the question
2. Step-by-step explanation with examples where applicable
3. Key formulas or concepts involved
4. Tips for remembering the concept

Format your response in clean markdown with headings, bullet points, and code blocks where appropriate.
Be encouraging and supportive in tone."""

        result = self.generate(prompt)

        if result:
            return {
                "answer": result,
                "sources": [doc["file"] for doc in context_docs] if context_docs else [],
                "ai_powered": True
            }

        # Fallback response
        return self._mock_answer(question, subject)

    def _mock_answer(self, question, subject=None):
        """Provide a helpful mock response when AI is unavailable."""

        mock_answers = {
            "binary search": {
                "answer": """## Binary Search Algorithm

**Binary Search** is an efficient searching algorithm that works on **sorted arrays**.

### How it works:
1. Compare the target value with the **middle element**
2. If target equals middle → **Found!**
3. If target < middle → Search the **left half**
4. If target > middle → Search the **right half**
5. Repeat until found or the search space is exhausted

### Example:
```
Array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
Target: 23

Step 1: mid = 16 → 23 > 16 → search right
Step 2: mid = 56 → 23 < 56 → search left
Step 3: mid = 23 → Found! ✅
```

### Time Complexity:
- **Best Case:** O(1) — element found at middle
- **Average Case:** O(log n)
- **Worst Case:** O(log n)

### 💡 Tip:
Remember: Binary search is like finding a word in a dictionary — you open the middle, decide which half to look in, and repeat!""",
            },
            "default": {
                "answer": f"""## Answer to Your Question

Thank you for your question about **{question}**!

This is a great topic{f' in {subject}' if subject else ''}. Here's a breakdown:

### Key Concepts:
- This topic is fundamental to understanding the broader subject area
- It involves several interconnected principles
- Practical applications include real-world engineering scenarios

### Step-by-Step Explanation:
1. **Start with the basics** — Understand the core definition and terminology
2. **Explore the theory** — Study the underlying mathematical/logical framework
3. **Practice with examples** — Work through solved examples from your textbook
4. **Apply to problems** — Try practice questions to reinforce your understanding

### 📚 Recommended Resources:
- Refer to your course textbook for detailed explanations
- Check the Notes section in StudyMate for additional materials
- Practice with previous year question papers

### 💡 Study Tip:
Try explaining this concept to a friend — if you can teach it, you truly understand it!

---
*⚠️ Note: Connect a Gemini API key for detailed, AI-powered explanations tailored to your specific question.*""",
            }
        }

        # Try to match keywords
        question_lower = question.lower()
        for key, response in mock_answers.items():
            if key != "default" and key in question_lower:
                return {"answer": response["answer"], "sources": [], "ai_powered": False}

        return {"answer": mock_answers["default"]["answer"], "sources": [], "ai_powered": False}
