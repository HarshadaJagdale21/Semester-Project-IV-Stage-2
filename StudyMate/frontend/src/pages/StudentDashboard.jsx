import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import {
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Brain
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/student/dashboard-stats');
        setData(res.data);
      } catch (err) {
        setError('Failed to load dashboard metrics. Check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
            <p className="mt-3 text-sm font-medium text-slate-600">Gathering academic progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-100">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                  RCPIT Student Portal
                </span>
                <span className="text-xs text-indigo-100">Batch {user?.year || '2024'}</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="mt-1 text-sm text-indigo-100 max-w-xl">
                Here is your academic overview for {user?.branch} • {user?.semester}. All AI agents are active and ready.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur text-center border border-white/10 min-w-[110px]">
                <div className="text-xs text-indigo-200">Department</div>
                <div className="text-base font-bold">{user?.branch}</div>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur text-center border border-white/10 min-w-[110px]">
                <div className="text-xs text-indigo-200">Current Sem</div>
                <div className="text-base font-bold">{user?.semester}</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tests Taken</span>
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{data?.stats.total_tests || 0}</span>
              <span className="text-xs text-slate-500">Evaluated</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Accuracy</span>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.stats.avg_accuracy > 0 ? `${data?.stats.avg_accuracy}%` : 'N/A'}
              </span>
              <span className="text-xs text-emerald-600 font-medium">Placement Benchmark</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subjects Tracked</span>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{data?.stats.total_subjects || 4}</span>
              <span className="text-xs text-slate-500">Engineering Units</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Weak Spots</span>
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{data?.weak_topics?.length || 0}</span>
              <span className="text-xs text-amber-700 font-medium">Needs Attention</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subject Progress Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Subject Syllabus Coverage</h3>
                <p className="text-xs text-slate-500">Progress across active semester modules</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Units Complete
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.subject_progress || []} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} unit="%" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="subject" stroke="#64748b" fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`${val}% Completed`, 'Progress']}
                  />
                  <Bar dataKey="progress" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Test Performance Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Test Accuracy Trend</h3>
                <p className="text-xs text-slate-500">Recent mock exam results & aptitude attempts</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                Placement Track
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.performance_history || []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} unit="%" stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`${val}% Accuracy`, 'Result']}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#accuracyGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lower Row: Weak Topics + Tasks */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Identified Weak Areas</h3>
                <p className="text-xs text-slate-500">Extracted from your quiz errors</p>
              </div>
            </div>

            <div className="space-y-3">
              {data?.weak_topics?.length > 0 ? (
                data.weak_topics.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-amber-50/60 p-3 border border-amber-100">
                    <span className="text-xs font-semibold text-amber-900">{t}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Revise
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No weak topics recorded yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upcoming Academic Tasks</h3>
                  <p className="text-xs text-slate-500">Curated weekly study milestones</p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">Auto-Scheduled</span>
            </div>

            <div className="divide-y divide-slate-100">
              {data?.tasks?.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{task.subject} • Due {task.due}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    task.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};