import React, { useState, useEffect } from "react";
import axios from "axios";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("dashboard");

  // AI Doubt State
  const [subject, setSubject] = useState("Machine Learning");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // Aptitude State
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Admin Upload State
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      alert("Invalid email or password!");
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser({});
    localStorage.clear();
  };

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAiAnswer("");
    try {
      const res = await axios.post("http://localhost:5000/api/ai/doubt", {
        question: question,
        subject: subject
      });
      setAiAnswer(res.data.answer);
    } catch (err) {
      alert("Could not reach AI Agent. Make sure backend is running.");
    }
    setLoading(false);
  };

  const loadQuestions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/aptitude/questions");
      setQuestions(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (view === "aptitude") loadQuestions();
  }, [view]);

  const submitTest = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/tests/submit", {
        student_email: user.email,
        answers: answers
      });
      setResult(res.data);
    } catch (e) {
      alert("Failed to submit test");
    }
  };

  const handleUploadNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/notes", {
        title: noteTitle,
        subject: noteSubject,
        content: noteContent
      });
      alert("Note uploaded successfully!");
      setNoteTitle("");
      setNoteSubject("");
      setNoteContent("");
    } catch (e) {
      alert("Upload failed.");
    }
  };

  if (!token) {
    return (
      <div style={{ maxWidth: "420px", margin: "70px auto", padding: "28px", border: "1px solid #cbd5e1", borderRadius: "8px", fontFamily: "sans-serif", backgroundColor: "#fff" }}>
        <h2 style={{ textAlign: "center", color: "#1e3a8a", margin: "0 0 4px 0" }}>StudyMate Portal</h2>
        <p style={{ textAlign: "center", fontSize: "12px", color: "#64748b", margin: "0 0 20px 0" }}>R. C. Patel Institute of Technology, Shirpur</p>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Email Address</label>
            <input
              type="email"
              required
              style={{ width: "100%", padding: "9px", marginTop: "4px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student.aiml@rcpit.ac.in"
            />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Password</label>
            <input
              type="password"
              required
              style={{ width: "100%", padding: "9px", marginTop: "4px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" style={{ padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: "24px", background: "#f8fafc", padding: "12px", borderRadius: "6px", fontSize: "12px", border: "1px solid #e2e8f0" }}>
          <p style={{ margin: "4px 0" }}><strong>Admin:</strong> admin@rcpit.ac.in | Admin@Rcpit2026</p>
          <p style={{ margin: "4px 0" }}><strong>Student:</strong> student.aiml@rcpit.ac.in | Student@2026</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", margin: "0", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <header style={{ background: "#0f172a", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px" }}>StudyMate — RCPIT Shirpur</h2>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{user.name} ({user.role})</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setView("dashboard")} style={{ padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Dashboard</button>
          <button onClick={() => setView("doubts")} style={{ padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>AI Doubt Solver</button>
          <button onClick={() => setView("aptitude")} style={{ padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Aptitude Test</button>
          {user.role === "admin" && (
            <button onClick={() => setView("admin")} style={{ padding: "6px 12px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Admin Portal</button>
          )}
          <button onClick={handleLogout} style={{ padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "30px auto", padding: "0 16px" }}>
        {view === "dashboard" && (
          <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ marginTop: 0 }}>Welcome back, {user.name}!</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "6px", background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 8px 0" }}>Academic Profile</h4>
                <p style={{ margin: "4px 0", fontSize: "14px" }}><strong>College:</strong> RCPIT Shirpur</p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}><strong>Branch:</strong> AIML (Sem 5)</p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}><strong>Status:</strong> Active Student</p>
              </div>
              <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "6px", background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 8px 0" }}>AI Multi-Agent Status</h4>
                <p style={{ margin: "4px 0", fontSize: "14px" }}><strong>Model:</strong> Ollama (llama3:8b)</p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}><strong>Location:</strong> Local Offline Server</p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}><strong>Agent:</strong> Academic Doubt Solver</p>
              </div>
            </div>
          </div>
        )}

        {view === "doubts" && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "24px", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>AI Academic Doubt Solver (Ollama Llama-3)</h3>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600" }}>Subject Context</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "4px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600" }}>Your Question</label>
              <textarea
                rows="4"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask any engineering doubt, e.g., Explain the QuickSort algorithm with an example..."
                style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "4px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
              />
            </div>
            <button onClick={askAI} disabled={loading} style={{ padding: "10px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
              {loading ? "Agent Thinking with Ollama..." : "Ask Doubt"}
            </button>

            {aiAnswer && (
              <div style={{ marginTop: "20px", background: "#f8fafc", padding: "16px", borderLeft: "4px solid #2563eb", borderRadius: "4px", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                <strong>AI Explanation:</strong>
                <p style={{ margin: "8px 0 0 0" }}>{aiAnswer}</p>
              </div>
            )}
          </div>
        )}

        {view === "aptitude" && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "24px", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>Placement Aptitude Evaluation</h3>
            {questions.map((q, idx) => (
              <div key={q._id} style={{ marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                <p style={{ margin: "0 0 8px 0" }}><strong>Q{idx + 1}. {q.question}</strong></p>
                {q.options.map((opt) => (
                  <label key={opt} style={{ display: "block", margin: "6px 0", cursor: "pointer", fontSize: "14px" }}>
                    <input
                      type="radio"
                      name={q._id}
                      checked={answers[q._id] === opt}
                      onChange={() => setAnswers({ ...answers, [q._id]: opt })}
                    />{" "}
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            <button onClick={submitTest} style={{ padding: "10px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
              Submit Test
            </button>

            {result && (
              <div style={{ marginTop: "16px", background: "#dcfce7", border: "1px solid #bbf7d0", padding: "14px", borderRadius: "6px" }}>
                <h4 style={{ margin: 0, color: "#166534" }}>Result: {result.score} / {result.total} Correct ({result.accuracy}%)</h4>
              </div>
            )}
          </div>
        )}

        {view === "admin" && user.role === "admin" && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "24px", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>Admin Portal: Upload Notes</h3>
            <form onSubmit={handleUploadNote} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning"
                  required
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "4px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Note Title</label>
                <input
                  type="text"
                  placeholder="e.g. Unit 1 Introduction"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "4px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Content / Key Concepts</label>
                <textarea
                  placeholder="Enter syllabus details or note summary..."
                  rows="4"
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "4px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                />
              </div>
              <button type="submit" style={{ padding: "10px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
                Upload Note
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}