"""
Test Generator Agent — Automatically generates question papers.
"""
from .base_agent import BaseAgent
import random


class TestGeneratorAgent(BaseAgent):
    """Generates question papers in MCQ and descriptive formats."""

    def generate_test(self, subject, question_type="mcq", num_questions=10, difficulty="medium", units=None):
        """Generate a test/question paper."""

        prompt = f"""You are an expert question paper generator for engineering college exams at R.C. Patel Institute of Technology.

Generate a question paper with these specifications:
- Subject: {subject}
- Question Type: {question_type.upper()}
- Number of Questions: {num_questions}
- Difficulty Level: {difficulty}
- Units/Topics: {units if units else "Full syllabus"}

Return a JSON object with this EXACT structure:
{{
    "paper_title": "Question Paper - {subject}",
    "subject": "{subject}",
    "type": "{question_type}",
    "difficulty": "{difficulty}",
    "total_marks": <number>,
    "duration": "60 minutes",
    "questions": [
        {{
            "q_no": 1,
            "question": "Question text here?",
            "marks": <number>,
            {"\"options\": [\"A) option1\", \"B) option2\", \"C) option3\", \"D) option4\"]," if question_type == "mcq" else ""}
            "answer": "Correct answer or model answer",
            "explanation": "Brief explanation of the answer"
        }}
    ]
}}

Make questions relevant, well-structured and exam-appropriate.
Return ONLY valid JSON, no other text.
"""

        result = self.generate(prompt, parse_json=True)

        if result:
            return result

        # Fallback mock
        return self._mock_test(subject, question_type, num_questions, difficulty)

    def _mock_test(self, subject, question_type, num_questions, difficulty):
        """Generate mock test questions when AI is not available."""

        mock_questions_bank = {
            "Data Structures": {
                "mcq": [
                    {"question": "What is the time complexity of binary search?", "options": ["A) O(n)", "B) O(log n)", "C) O(n²)", "D) O(1)"], "answer": "B) O(log n)", "explanation": "Binary search divides the search space in half at each step, resulting in logarithmic time complexity."},
                    {"question": "Which data structure uses LIFO principle?", "options": ["A) Queue", "B) Stack", "C) Array", "D) Linked List"], "answer": "B) Stack", "explanation": "Stack follows Last In First Out (LIFO) principle where the last element added is the first to be removed."},
                    {"question": "What is the worst-case time complexity of quicksort?", "options": ["A) O(n log n)", "B) O(n)", "C) O(n²)", "D) O(log n)"], "answer": "C) O(n²)", "explanation": "Quicksort's worst case occurs when the pivot is always the smallest or largest element."},
                    {"question": "Which traversal of BST gives sorted output?", "options": ["A) Preorder", "B) Postorder", "C) Inorder", "D) Level order"], "answer": "C) Inorder", "explanation": "Inorder traversal (Left-Root-Right) of a BST always produces sorted output."},
                    {"question": "What is the maximum number of nodes in a binary tree of height h?", "options": ["A) 2^h", "B) 2^(h+1) - 1", "C) 2h + 1", "D) h²"], "answer": "B) 2^(h+1) - 1", "explanation": "A complete binary tree of height h has at most 2^(h+1) - 1 nodes."},
                ],
                "descriptive": [
                    {"question": "Explain the concept of AVL trees. How do rotations maintain balance?", "answer": "AVL trees are self-balancing BSTs where the difference between heights of left and right subtrees cannot be more than one. When this property is violated after insertion or deletion, rotations (LL, RR, LR, RL) are performed to restore balance.", "explanation": "AVL trees guarantee O(log n) operations by maintaining height balance."},
                    {"question": "Compare and contrast BFS and DFS graph traversal algorithms.", "answer": "BFS explores level by level using a queue, while DFS explores as deep as possible using a stack/recursion. BFS finds shortest path in unweighted graphs; DFS uses less memory for deep graphs.", "explanation": "Both are fundamental graph traversal strategies with different use cases."},
                    {"question": "Explain hashing with collision resolution techniques.", "answer": "Hashing maps keys to array indices using a hash function. Collisions (when two keys map to same index) are resolved using: 1) Chaining - linked lists at each index, 2) Open addressing - linear probing, quadratic probing, or double hashing.", "explanation": "Hashing provides O(1) average case for search, insert, and delete operations."},
                ]
            },
            "Machine Learning": {
                "mcq": [
                    {"question": "Which algorithm is used for classification?", "options": ["A) Linear Regression", "B) K-Means", "C) Random Forest", "D) PCA"], "answer": "C) Random Forest", "explanation": "Random Forest is an ensemble learning method used for classification and regression tasks."},
                    {"question": "What does CNN stand for?", "options": ["A) Central Neural Network", "B) Convolutional Neural Network", "C) Computed Neural Network", "D) Connected Neural Network"], "answer": "B) Convolutional Neural Network", "explanation": "CNNs are specialized neural networks designed for processing grid-like data such as images."},
                    {"question": "Which is an unsupervised learning algorithm?", "options": ["A) SVM", "B) Decision Tree", "C) K-Means Clustering", "D) Logistic Regression"], "answer": "C) K-Means Clustering", "explanation": "K-Means is an unsupervised algorithm that groups data into K clusters based on feature similarity."},
                ],
                "descriptive": [
                    {"question": "Explain the bias-variance tradeoff in machine learning.", "answer": "Bias is the error from oversimplifying assumptions. Variance is sensitivity to training data fluctuations. High bias = underfitting. High variance = overfitting. The goal is to find the sweet spot that minimizes total error.", "explanation": "This tradeoff is fundamental to model selection and regularization."},
                    {"question": "Describe the backpropagation algorithm in neural networks.", "answer": "Backpropagation calculates gradients of the loss function with respect to weights by applying the chain rule layer by layer from output to input. These gradients are then used by optimization algorithms like SGD to update weights and minimize error.", "explanation": "Backpropagation is the key algorithm that makes training deep neural networks feasible."},
                ]
            }
        }

        # Get questions for the subject or use generic ones
        subject_bank = mock_questions_bank.get(subject, {})
        available = subject_bank.get(question_type, [])

        if not available:
            # Generate generic questions
            available = []
            for i in range(num_questions):
                if question_type == "mcq":
                    available.append({
                        "question": f"Sample {subject} question {i + 1} ({difficulty} difficulty)?",
                        "options": [f"A) Option A", f"B) Option B", f"C) Option C", f"D) Option D"],
                        "answer": "A) Option A",
                        "explanation": f"This is a sample explanation for {subject} question {i + 1}."
                    })
                else:
                    available.append({
                        "question": f"Explain the concept of topic {i + 1} in {subject}. Provide examples.",
                        "answer": f"This is a model answer for topic {i + 1} in {subject}. The concept involves...",
                        "explanation": f"Understanding topic {i + 1} is crucial for mastering {subject}."
                    })

        # Select and number questions
        selected = available[:num_questions]
        if len(selected) < num_questions:
            selected = selected * (num_questions // len(selected) + 1)
            selected = selected[:num_questions]

        questions = []
        for i, q in enumerate(selected):
            q_entry = {
                "q_no": i + 1,
                "question": q["question"],
                "marks": 2 if question_type == "mcq" else 10,
                "answer": q["answer"],
                "explanation": q["explanation"]
            }
            if question_type == "mcq" and "options" in q:
                q_entry["options"] = q["options"]
            questions.append(q_entry)

        total_marks = sum(q["marks"] for q in questions)

        return {
            "paper_title": f"Question Paper - {subject}",
            "subject": subject,
            "type": question_type,
            "difficulty": difficulty,
            "total_marks": total_marks,
            "duration": "60 minutes" if question_type == "mcq" else "180 minutes",
            "questions": questions
        }
