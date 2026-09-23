import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Users, FileText, BookOpen, Award, CheckCircle } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/students')
        ]);
        setStats(statsRes.data);
        setStudents(studentsRes.data);
      } catch (err) {
        alert('Admin authorization check failed.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs text-slate-500">Verifying administrative access...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Administrator Command Center</h1>
        <p className="text-xs text-slate-500 mt-1">Manage institutional knowledge, monitor student testing, and audit performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase">Enrolled Students</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_students || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase">Notes & Syllabus</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{(stats?.total_notes || 0) + (stats?.total_syllabus || 0)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase">Aptitude Questions</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_questions || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Test Attempts</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_test_attempts || 0}</div>
        </div>
      </div>

      {/* Student Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Student Progress & Evaluation Audit</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Branch</th>
                <th className="p-3.5">Last Test Score</th>
                <th className="p-3.5">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-bold text-slate-800">{s.name}</td>
                  <td className="p-3.5 text-slate-500">{s.email}</td>
                  <td className="p-3.5">{s.branch}</td>
                  <td className="p-3.5 font-semibold">{s.last_score}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                      {s.accuracy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};