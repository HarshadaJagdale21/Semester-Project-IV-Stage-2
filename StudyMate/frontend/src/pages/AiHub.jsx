
import React, { useState } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Brain, Sparkles, Send, Calendar, CheckSquare, Loader2, AlertCircle } from 'lucide-react';

export const AiHub = () => {
  const [activeTab, setActiveTab] = useState('doubt');

  // Agent 1: Doubt Solver
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Deep Learning');
  const [mode, setMode] = useState('Detailed Explanation');
  const [doubtResponse, setDoubtResponse] = useState(null);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Agent 2: Study Planner
  const [planSubject, setPlanSubject] = useState('Deep Learning');
  
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [examDate, setExamDate] = useState('');
  const [hours, setHours] = useState(3);
  const [planResponse, setPlanResponse] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);


  const calculateDays = () => {
    if (!examDate) return 0;
    const today = new Date(getTodayStr());
    const exam = new Date(examDate);
    const diffTime = exam - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleAskDoubt = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setDoubtLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/ai/doubt', { question, subject, mode });
      setDoubtResponse(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'AI service error. Please ensure backend is running.');
    } finally {
      setDoubtLoading(false);
    }
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    const calculatedDays = calculateDays();
    if (calculatedDays <= 0 || calculatedDays > 30) {
      setErrorMsg('Please select a valid Exam Date (1 to 30 days from today).');
      return;
    }
    setPlanLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/ai/study-plan', { subject: planSubject, days: calculatedDays, hours_per_day: hours });
      setPlanResponse({ plan: res.data.plan, examDate: examDate });
    } catch (err) {
      setErrorMsg('Failed to generate timetable. Check terminal logs.');
    } finally {
      setPlanLoading(false);
    }
  };


  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
          <Sparkles className="h-4 w-4" /> Multi-Agent Intelligence Engine
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Academic AI Hub</h1>
        <p className="text-sm text-slate-500 mt-1">Autonomous agents grounded in your uploaded department materials.</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-200 mb-8 pb-1">
        <button
          onClick={() => setActiveTab('doubt')}
          className={`pb-3 px-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'doubt'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Brain className="h-4 w-4" /> Agent 1: RAG Doubt Solver
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`pb-3 px-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'planner'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" /> Agent 2: Subject Study Planner
        </button>
      </div>

      {/* TAB 1: RAG Doubt Solver */}
      {activeTab === 'doubt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Ask Academic Doubt</h2>
            <p className="text-xs text-slate-500 mb-5">Grounds answers directly in your lecture notes.</p>

            <form onSubmit={handleAskDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Subject</label>
                <input
                  type="text"
                  list="subjects-list"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-slate-50"
                  placeholder="Type or select any subject..."
                />
                <datalist id="subjects-list">
                  <option value="Deep Learning" />
                  <option value="Machine Learning" />
                  <option value="Database Systems" />
                  <option value="Natural Language Processing" />
                  <option value="Computer Networks" />
                  <option value="Cloud Computing" />
                  <option value="Data Structures & Algorithms" />
                  <option value="Operating Systems" />
                  <option value="Software Engineering" />
                  <option value="Engineering Mathematics" />
                  <option value="Automata Theory" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Response Style</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-slate-50"
                >
                  <option value="Detailed Explanation">Detailed Explanation (Exam Oriented)</option>
                  <option value="Short Viva Answer">Short Viva Answer (Oral Prep)</option>
                  <option value="Step-by-Step Numerical">Step-by-Step Numerical & Derivation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Question / Concept</label>
                <textarea
                  rows={5}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Explain how attention mechanism works in Transformer models..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-slate-50 leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={doubtLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {doubtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {doubtLoading ? 'Retrieving Knowledge Base...' : 'Solve with AI Agent'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Agent Answer</h2>
                <p className="text-xs text-slate-500">Structured academic breakdown</p>
              </div>
              {doubtResponse && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {doubtResponse.grounding}
                </span>
              )}
            </div>

            {doubtResponse ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
                {doubtResponse.answer}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-8">
                <Brain className="h-10 w-10 mb-3 text-slate-300" />
                <p className="font-semibold text-slate-600">No query submitted yet</p>
                <p className="text-slate-400 mt-1 max-w-xs">Ask a question to invoke the RAG pipeline with your notes context.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Study Planner */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Generate Timetable</h2>
            <p className="text-xs text-slate-500 mb-5">Subject-locked planner tailored to your study bandwidth.</p>

            <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  list="subjects-list"
                  value={planSubject}
                  onChange={(e) => setPlanSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50 font-medium"
                  placeholder="Type or select any subject..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exam Date</label>
                <input
                  type="date"
                  min={getTodayStr()}
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hours / Day</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={planLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {planLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                {planLoading ? 'Planning...' : 'Generate Plan'}
              </button>
            </form>
          </div>

          {planResponse && planResponse.plan && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {planResponse.plan.map((dayItem, idx) => {
                const currentStudyDate = new Date(getTodayStr());
                currentStudyDate.setDate(currentStudyDate.getDate() + (dayItem.day - 1));
                const isExamDay = dayItem.day === calculateDays();

                return (
                <div key={idx} className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${isExamDay ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border inline-block mb-1 w-max ${isExamDay ? 'bg-red-100 text-red-700 border-red-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                          Day {dayItem.day}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {currentStudyDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {isExamDay && ' (Exam Eve)'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{dayItem.hours} Study Hours</span>
                    </div>
                    {dayItem.module && (
                      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                        {dayItem.module}
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-slate-900 mb-3">{dayItem.topic}</h3>
                    
                    {dayItem.advice && (
                      <div className="mb-4 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                          <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 text-amber-600">Expert Advice</span>
                          {dayItem.advice}
                        </p>
                      </div>
                    )}

                    <ul className="space-y-2 mb-4">
                      {dayItem.tasks.map((task, tIdx) => (
                        <li key={tIdx} className="text-xs text-slate-600 flex items-start gap-2">
                          <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Target: Unit Mastery
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}


    </DashboardLayout>
  );
};