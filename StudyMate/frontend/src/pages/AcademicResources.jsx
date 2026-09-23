import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { BookOpen, FileText, Download } from 'lucide-react';

export const AcademicResources = () => {
  const [resources, setResources] = useState([]);
  const [branch, setBranch] = useState('AIML');
  const [semester, setSemester] = useState('Semester 5');
  const [type, setType] = useState('notes');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/resources?type=${type}&branch=${branch}&semester=${semester}`);
        setResources(res.data);
      } catch (err) {
        alert('Failed to load resources.');
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [type, branch, semester]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Academic Resource Repository</h1>
        <p className="text-xs text-slate-500 mt-1">Hierarchical curriculum explorer: Branch → Year → Semester → Subject → Unit</p>
      </div>

      {/* Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs">
            <option value="AIML">AIML</option>
            <option value="CSE">CSE</option>
            <option value="DS">DS</option>
            <option value="IT">IT</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs">
            <option value="Semester 3">Semester 3</option>
            <option value="Semester 4">Semester 4</option>
            <option value="Semester 5">Semester 5</option>
            <option value="Semester 6">Semester 6</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Category</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs">
            <option value="notes">Class Notes</option>
            <option value="syllabus">Syllabus</option>
            <option value="pyqs">Previous Year Papers (PYQ)</option>
          </select>
        </div>
      </div>

      {/* Resource Cards */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Retrieving department materials...</div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((item) => (
            <div key={item._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    {item.subject}
                  </span>
                  <span className="text-xs text-slate-400">{item.unit || item.semester}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3">{item.content || 'Department verified academic curriculum document.'}</p>
              </div>
              <button
                onClick={() => alert(`Opening ${item.title}`)}
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="h-3.5 w-3.5" /> View / Download
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
          No resources found for the selected branch/semester. Check another category.
        </div>
      )}
    </DashboardLayout>
  );
};