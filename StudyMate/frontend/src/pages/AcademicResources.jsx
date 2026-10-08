import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { BASE_URL } from '../api/client';
import {
  BookOpen,
  Search,
  FileText,
  X,
  GraduationCap
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';

export const AcademicResources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [branch, setBranch] = useState('AIML');
  const [semester, setSemester] = useState('Semester 8');
  const [subject, setSubject] = useState('ALL');
  const [type, setType] = useState('notes');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModalDoc, setActiveModalDoc] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/resources?type=${type}&branch=${branch}&semester=${semester}&subject=${subject}&search=${searchTerm}`
      );
      setResources(res.data.records || []);
      setAvailableSubjects(res.data.available_subjects || []);
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [type, branch, semester, subject]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  return (
    <DashboardLayout>
      {/* Header Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
          <GraduationCap className="h-4 w-4" /> RCPIT Department Repository
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Curriculum & Resource Explorer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Browse indexed departmental lecture notes, PPTs, syllabi, and study materials.
        </p>
      </div>

      {/* Control Bar: Categories & Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex gap-2">
            {[
              { id: 'notes', label: 'Lecture Notes & PPTs' },
              { id: 'syllabus', label: 'Official Syllabus' },
              { id: 'pyqs', label: 'Question Papers (PYQs)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setType(tab.id); setSubject('ALL'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${type === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topics, units, keywords..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none bg-slate-50 font-medium"
            />
          </form>
        </div>

        {/* Cascading Filter Selectors */}
        <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-3`}>
          {user?.role === 'admin' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 font-medium focus:border-indigo-600 focus:outline-none"
                >
                  <option value="AIML">AIML (AI & Machine Learning)</option>
                  <option value="CSE">Computer Engineering (CSE)</option>
                  <option value="DS">Data Science (DS)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ALL">All Departments</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 font-medium focus:border-indigo-600 focus:outline-none"
                >
                  <option value="Semester 8">Semester 8 (Final Year)</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="ALL">All Semesters</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Filter by Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 font-medium focus:border-indigo-600 focus:outline-none"
            >
              <option value="ALL">All Detected Subjects</option>
              {availableSubjects.map((sub, i) => (
                <option key={i} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-semibold text-slate-500">
          Showing <strong className="text-slate-800">{resources.length}</strong> indexed academic document(s)
        </span>
      </div>

      {/* Grid of Resource Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-xs font-semibold text-slate-500">Searching MongoDB dataset...</p>
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((item) => (
            <div
              key={item._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {item.subject || 'Engineering'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                    {item.file_type || 'PDF'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                  {item.preview || 'Extracted lecture slides and exam references.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">
                  {item.unit || item.semester}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (item.file_type?.toLowerCase() === 'ppt') {
                        const element = document.createElement("a");
                        const file = new Blob([item.content || item.preview], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = `${item.title.replace(/\s+/g, '_')}.ppt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      } else if (item.file_data) {
                        const binaryString = window.atob(item.file_data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], { type: 'application/pdf' });
                        const element = document.createElement("a");
                        element.href = URL.createObjectURL(blob);
                        element.download = `${item.title.replace(/\s+/g, '_')}.pdf`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      } else {
                        const doc = new jsPDF();
                        doc.setFontSize(16);
                        doc.text(item.title || 'Academic Resource', 20, 20);
                        doc.setFontSize(12);
                        const splitText = doc.splitTextToSize(item.content || item.preview || '', 170);
                        doc.text(splitText, 20, 30);
                        doc.save(`${item.title.replace(/\s+/g, '_')}.pdf`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 border border-emerald-100 hover:border-emerald-200"
                    title="Download File"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download
                  </button>
                  <button
                    onClick={() => setActiveModalDoc(item)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" /> Read
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No documents found matching these filters</p>
          <p className="text-xs text-slate-400 mt-1">Try switching Semester to "All Semesters" or clear the search keyword.</p>
        </div>
      )}

      {/* Document Reader Modal */}
      {activeModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 mr-2">
                  {activeModalDoc.subject} • {activeModalDoc.unit}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{activeModalDoc.title}</h2>
              </div>
              <button
                onClick={() => setActiveModalDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-100 flex flex-col relative">
              {activeModalDoc.file_url ? (
                <iframe
                  src={`${BASE_URL}${activeModalDoc.file_url}`}
                  className="w-full h-[60vh] border-0"
                  title="PDF Viewer"
                />
              ) : activeModalDoc.file_name && activeModalDoc.file_type === 'PDF' ? (
                <iframe
                  src={`${BASE_URL}/api/files/${encodeURIComponent(activeModalDoc.file_name)}`}
                  className="w-full h-[60vh] border-0"
                  title="PDF Viewer"
                />
              ) : activeModalDoc.file_name ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Preview not available for this file type.</p>
                  <a
                    href={`${BASE_URL}/api/files/${encodeURIComponent(activeModalDoc.file_name)}`}
                    download
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm"
                  >
                    Download File
                  </a>
                </div>
              ) : (
                <div className="p-6 overflow-y-auto h-64 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                  {activeModalDoc.content || 'No text extracted for this document.'}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              {activeModalDoc.file_url ? (
                <a
                  href={`${BASE_URL}${activeModalDoc.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                >
                  Download Original File
                </a>
              ) : activeModalDoc.file_name && (
                <a
                  href={`${BASE_URL}/api/files/${encodeURIComponent(activeModalDoc.file_name)}`}
                  download
                  className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                >
                  Download Original File
                </a>
              )}
              <button
                onClick={() => setActiveModalDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};