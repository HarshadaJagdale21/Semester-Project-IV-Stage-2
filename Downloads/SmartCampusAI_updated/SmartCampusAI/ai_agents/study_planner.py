"""
Study Planner Agent — Generates personalized study schedules.
"""
from .base_agent import BaseAgent
import json
from datetime import datetime, timedelta


class StudyPlannerAgent(BaseAgent):
    """Generates personalized study plans based on branch, semester, and exam schedule."""

    def generate_plan(self, branch, semester, exam_date, hours_per_day, subjects=None):
        """Generate a structured study plan."""

        prompt = f"""You are an expert academic study planner for engineering students at R.C. Patel Institute of Technology.

Create a detailed, day-by-day study plan with the following details:
- Branch: {branch}
- Semester: {semester}
- Exam Date: {exam_date}
- Available Study Hours Per Day: {hours_per_day}
- Subjects: {subjects if subjects else "All subjects for this semester"}

Return a JSON object with this EXACT structure:
{{
    "plan_title": "Study Plan for [branch] - Semester [sem]",
    "total_days": <number>,
    "subjects": ["subject1", "subject2", ...],
    "strategy_tips": ["tip1", "tip2", "tip3"],
    "daily_schedule": [
        {{
            "day": 1,
            "date": "YYYY-MM-DD",
            "subject": "Subject Name",
            "topics": ["Topic 1", "Topic 2"],
            "hours": <number>,
            "priority": "high/medium/low",
            "activity": "Study new topics / Revision / Practice"
        }}
    ],
    "revision_plan": "Brief revision strategy for the last few days"
}}

Make the plan realistic and efficient. Prioritize difficult topics early. Include revision days before the exam.
Return ONLY valid JSON, no other text.
"""

        result = self.generate(prompt, parse_json=True)

        if result:
            return result

        # Fallback mock response
        return self._mock_plan(branch, semester, exam_date, hours_per_day)

    def _mock_plan(self, branch, semester, exam_date, hours_per_day):
        """Generate a mock study plan when AI is not available."""
        try:
            exam_dt = datetime.strptime(exam_date, "%Y-%m-%d")
        except (ValueError, TypeError):
            exam_dt = datetime.now() + timedelta(days=30)

        days_left = max((exam_dt - datetime.now()).days, 7)

        subjects = {
            "CSE": ["Data Structures", "Operating Systems", "Database Management", "Computer Networks", "Software Engineering"],
            "AIML": ["Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", "Data Mining"],
            "DS": ["Statistics", "Data Analytics", "Big Data", "Data Visualization", "Predictive Modeling"],
        }.get(branch, ["Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5"])

        daily_schedule = []
        for i in range(min(days_left, 30)):
            current_date = datetime.now() + timedelta(days=i + 1)
            sub_index = i % len(subjects)
            is_revision = i >= days_left - 5

            daily_schedule.append({
                "day": i + 1,
                "date": current_date.strftime("%Y-%m-%d"),
                "subject": subjects[sub_index],
                "topics": [f"Unit {(i // len(subjects)) + 1} - Key Concepts", f"Practice Problems Set {i + 1}"],
                "hours": int(hours_per_day),
                "priority": "high" if i < 10 else ("medium" if not is_revision else "high"),
                "activity": "Revision & Practice" if is_revision else "Study new topics"
            })

        return {
            "plan_title": f"Study Plan for {branch} - Semester {semester}",
            "total_days": len(daily_schedule),
            "subjects": subjects,
            "strategy_tips": [
                "Start with the most difficult subjects first",
                "Use active recall and spaced repetition techniques",
                "Take a 10-minute break every 50 minutes of study",
                "Solve previous year question papers in the last week",
                "Revise all subjects 2 days before the exam"
            ],
            "daily_schedule": daily_schedule,
            "revision_plan": "Last 5 days: Revise all subjects, focus on formulas and key concepts. Solve at least 2 previous papers per subject."
        }
