"""
Base Agent — Shared logic for all StudyMate AI agents.
Connects to Google Gemini API (or falls back to mock responses).
"""
import json
import os

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class BaseAgent:
    """Base class for all AI agents with Gemini API integration."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model = None
        if self.api_key and GENAI_AVAILABLE:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-2.0-flash")
            except Exception:
                self.model = None

    @property
    def is_available(self):
        return self.model is not None

    def generate(self, prompt, parse_json=False):
        """Send prompt to Gemini and return the response text."""
        if not self.is_available:
            return None

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()

            if parse_json:
                # Try to extract JSON from markdown code blocks
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)

            return text
        except Exception as e:
            print(f"[AI Agent Error] {e}")
            return None
