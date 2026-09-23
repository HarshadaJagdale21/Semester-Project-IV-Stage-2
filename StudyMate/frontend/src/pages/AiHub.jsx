import React, { useState } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Brain, Sparkles, Send, Calendar, CheckSquare, Loader2 } from 'lucide-react';

export const AiHub = () => {
  const [activeTab, setActiveTab] = useState('doubt');

  // Doubt Solver State
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Machine Learning');
  const [mode, setMode] = useState('Detailed Explanation');
  const [doubtResponse, setDoubtResponse] = useState(null);
  const [doubtLoading, setDoubtLoading] = useState(false);

  // Study Planner State
  const [planSubject, setPlanSubject] = useState('Machine Learning');
  const [days, setDays] = useState(5);
  const [hours, setHours] = useState(3);
  const [planResponse, setPlanResponse] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  const handleAskDoubt = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setDoubtLoading(true);
    try {
      const res = await api.post('/ai/doubt', { question, subject, mode });
      setDoubtResponse(res.data);
    } catch (err) {
      alert('Failed to connect to AI engine. Check terminal.');
    } finally {
      setDoubtLoading(false);
    }
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setPlanLoading(true);
    try {
      const res = await api.post('/ai/study-plan', { subject: planSubject, days, hours_per_day: hours });
      setPlanResponse(res.data.plan);
    } catch (err) {
      alert('Plan generation failed. Check terminal.');
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Multi-Agent Academic AI Hub</h1>
        <p className="text-xs text-slate-500 mt-1">Autonomous agents grounded in your RCPIT syllabus</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('doubt')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'doubt' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Brain className="h-4 w-4" /> Agent 1: RAG Doubt Solver
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'planner' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" /> Agent 2: Subject Study Planner
        </button>
      </div>

      {/* TAB 1: Doubt Solver */}
      {activeTab === 'doubt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Submit Academic Doubt</h2>
            <form onSubmit={handleAskDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-600"
                >
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Database Systems">Database Systems</option>
                  <option value="Algorithms & DAA">Algorithms & DAA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Response Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-600"
                >
                  <option value="Detailed Explanation">Detailed Explanation</option>
                  <option value="Short Viva Answer">Short Viva Answer</option>
                  <option value="Step-by-Step Numerical">Step-by-Step Numerical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Question</label>
                <textarea
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Explain how Backpropagation minimizes error in Neural Networks..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={doubtLoading}
                className="w-full bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {doubtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {doubtLoading ? 'Retrieving & Generating...' : 'Ask AI Agent'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-base font-bold text-slate-900 mb-2">Agent Answer & Grounding</h2>
            {doubtResponse ? (
              <div className="flex-1 overflow-y-auto">
                <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Grounding: {doubtResponse.grounding}
                </div>
                <div className="prose prose-sm text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {doubtResponse.answer}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Sparkles className="h-8 w-8 mb-2 text-slate-300" />
                Ask a question to trigger the RAG pipeline.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Study Planner */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Generate Personalized Timetable</h2>
            <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={planSubject}
                  onChange={(e) => setPlanSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-600"
                >
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Database Systems">Database Systems</option>
                  <option value="Algorithms & DAA">Algorithms & DAA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Available Days</label>
                <input
                  type="number"
                  min="2"
                  max="14"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hours / Day</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={planLoading}
                className="bg-indigo-600 text-white text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {planLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                {planLoading ? 'Planning...' : 'Generate Plan'}
              </button>
            </form>
          </div>

          {planResponse && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planResponse.map((dayItem, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Day {dayItem.day}
                    </span>
                    <span className="text-xs text-slate-500">{dayItem.hours} Hours</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">{dayItem.topic}</h3>
                  <ul className="space-y-1.5">
                    {dayItem.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="text-xs text-slate-600 flex items-start gap-2">
                        <CheckSquare className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};