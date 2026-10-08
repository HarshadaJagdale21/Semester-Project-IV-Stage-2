import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Timer, CheckCircle, AlertCircle, Award, Brain, CheckSquare, Loader2 } from 'lucide-react';

export const AptitudeTest = () => {
  const [activeTab, setActiveTab] = useState('exam');

  // Exam States
  const [questions, setQuestions] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Trainer (Agent 3) States
  const [aptCategory, setAptCategory] = useState('Quantitative Aptitude');
  const [aptTopic, setAptTopic] = useState('');
  const [aptCount, setAptCount] = useState(5);
  const [aptDifficulty, setAptDifficulty] = useState('Medium');
  const [aptResponse, setAptResponse] = useState(null);
  const [aptLoading, setAptLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      const test_question_ids = selectedTest ? selectedTest.questions.map(q => q._id) : [];
      const res = await api.post('/tests/submit', { answers, test_question_ids });
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting test.');
    }
  };

  const handleGenerateAptitude = async (e) => {
    e.preventDefault();
    setAptLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/ai/aptitude', { 
        category: aptCategory, 
        topic: aptTopic, 
        count: aptCount, 
        difficulty: aptDifficulty 
      });
      setAptResponse(res.data.questions);
    } catch (err) {
      setErrorMsg('Failed to generate aptitude questions. Check terminal logs.');
    } finally {
      setAptLoading(false);
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
        {activeTab === 'exam' && !submitted && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
            <Timer className="h-4 w-4" /> Live Exam Session
          </div>
        )}
      </div>

      <div className="flex gap-3 border-b border-slate-200 mb-8 pb-1">
        <button
          onClick={() => setActiveTab('exam')}
          className={`pb-3 px-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'exam'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="h-4 w-4" /> Standard Exam
        </button>
        <button
          onClick={() => setActiveTab('trainer')}
          className={`pb-3 px-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'trainer'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="h-4 w-4" /> Agent 3: Placement Aptitude Trainer
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'exam' && !selectedTest && (
        <div className="space-y-8">
          {Object.entries(
            questions.reduce((acc, q) => {
              const cat = q.category || 'General Aptitude';
              const top = q.topic || 'General Test';
              if (!acc[cat]) acc[cat] = {};
              if (!acc[cat][top]) acc[cat][top] = [];
              acc[cat][top].push(q);
              return acc;
            }, {})
          ).map(([categoryName, topics]) => (
            <div key={categoryName} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                {categoryName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(topics).flatMap(([topicName, topicQuestions]) => {
                  const chunks = [];
                  for (let i = 0; i < topicQuestions.length; i += 10) {
                    chunks.push(topicQuestions.slice(i, i + 10));
                  }
                  return chunks.map((chunk, index) => {
                    const testName = chunks.length > 1 ? `${topicName} (Part ${index + 1})` : topicName;
                    return (
                      <div key={testName} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition bg-slate-50 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800 mb-1">{testName}</h3>
                          <p className="text-xs text-slate-500 mb-4">{chunk.length} Questions • Official Test</p>
                        </div>
                        <button 
                          onClick={() => setSelectedTest({ topic: testName, questions: chunk })}
                          className="w-full bg-indigo-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-indigo-700 transition"
                        >
                          Start Test
                        </button>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
              No standard tests have been uploaded by the admin yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'exam' && selectedTest && (
        <div>
          <button 
            onClick={() => { setSelectedTest(null); setSubmitted(false); setResult(null); setAnswers({}); }}
            className="mb-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            ← Back to Tests
          </button>
          
          <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedTest.topic}</h2>

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
            {selectedTest.questions.map((q, idx) => {
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
        </div>
      )}

      {activeTab === 'trainer' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Agent 3: Placement Aptitude Trainer</h2>
            <p className="text-xs text-slate-500 mb-5">Generate company-specific aptitude questions to practice.</p>

            <form onSubmit={handleGenerateAptitude} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={aptCategory}
                  onChange={(e) => setAptCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50 font-medium"
                >
                  <option value="Quantitative Aptitude">Quantitative</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="Verbal Ability">Verbal Ability</option>
                  <option value="Technical Aptitude">Technical Aptitude</option>
                </select>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specific Topic</label>
                <input
                  type="text"
                  value={aptTopic}
                  onChange={(e) => setAptTopic(e.target.value)}
                  placeholder="e.g. Time & Work, Data Interpretation..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Count</label>
                <select
                  value={aptCount}
                  onChange={(e) => setAptCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50 font-medium"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Difficulty</label>
                <select
                  value={aptDifficulty}
                  onChange={(e) => setAptDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50 font-medium"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Company Specific">Company Specific</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={aptLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                {aptLoading ? 'Generating...' : 'Generate Test'}
              </button>
            </form>
          </div>

          {aptResponse && (
            <div className="space-y-4">
              {aptResponse.map((q, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
                  <span className="absolute top-5 right-5 text-xs font-bold text-slate-300">Q{idx + 1}</span>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 pr-8">{q.question}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="text-xs p-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-700 font-medium">
                        {opt}
                      </div>
                    ))}
                  </div>
                  <details className="text-xs cursor-pointer group-details">
                    <summary className="font-bold text-indigo-600 hover:text-indigo-700 outline-none list-none flex items-center gap-1">
                      <span className="mr-1">▶</span> Show Solution & Explanation
                    </summary>
                    <div className="mt-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <p className="font-bold text-emerald-800 mb-1">Answer: {q.correct_answer}</p>
                      <p className="text-emerald-700 leading-relaxed font-medium">{q.explanation}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};