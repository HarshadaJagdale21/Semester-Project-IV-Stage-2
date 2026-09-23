import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Timer, CheckCircle, AlertCircle, Award } from 'lucide-react';

export const AptitudeTest = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/aptitude/questions');
        setQuestions(res.data);
      } catch (err) {
        alert('Failed to load questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleSelect = (qid, opt) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: opt }));
  };

  const handleSubmit = async () => {
    try {
      const res = await api.post('/tests/submit', { answers });
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting test.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs text-slate-500">Loading placement questions...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Placement Aptitude Evaluation</h1>
          <p className="text-xs text-slate-500 mt-1">Timed assessment covering Quant, Logical & Technical subjects</p>
        </div>
        {!submitted && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
            <Timer className="h-4 w-4" /> Live Exam Session
          </div>
        )}
      </div>

      {submitted && result && (
        <div className="mb-6 p-6 rounded-2xl bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
          <div>
            <h2 className="text-xl font-bold">Test Performance Summary</h2>
            <p className="text-xs text-indigo-100 mt-1">Recorded to your official student profile.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-black">{result.score} / {result.total}</div>
              <div className="text-[10px] text-indigo-200 uppercase font-semibold">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{result.accuracy}%</div>
              <div className="text-[10px] text-indigo-200 uppercase font-semibold">Accuracy</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const detail = result?.detailed_results?.find((d) => d.id === q._id);
          return (
            <div key={q._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-600">Question {idx + 1}</span>
                <span className="text-[10px] uppercase font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {q.topic || 'General'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-4">{q.question}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = answers[q._id] === opt;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(q._id, opt)}
                      className={`text-left p-3 rounded-xl border text-xs font-medium transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {submitted && detail && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    {detail.is_correct ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Correct Answer
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> Incorrect (Correct: {detail.correct_answer})
                      </span>
                    )}
                  </div>
                  {detail.explanation && (
                    <p className="text-slate-500 mt-1">{detail.explanation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-indigo-600 text-white font-bold text-xs py-3 px-8 rounded-xl hover:bg-indigo-700 shadow-md transition"
          >
            Submit Aptitude Test
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};