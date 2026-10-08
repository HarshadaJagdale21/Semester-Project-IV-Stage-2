import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Edit2, Save, X } from 'lucide-react';

export const SyllabusManager = () => {
  const { user } = useAuth();
  const [syllabusList, setSyllabusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      // Fetch syllabus for AIML. If student, backend handles semester filter. If admin, it fetches AIML.
      const res = await api.get('/resources?type=syllabus&branch=AIML');
      setSyllabusList(res.data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (syll) => {
    setEditingId(syll._id);
    setEditContent(syll.content || "");
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/syllabus/${id}`, { content: editContent });
      alert("Syllabus updated successfully!");
      setEditingId(null);
      fetchSyllabus();
    } catch (err) {
      alert("Failed to update syllabus.");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <BookOpen className="mr-3 text-indigo-600" /> 
          AIML Syllabus Curriculum
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin 
            ? "Manage and update syllabus content for the AIML department." 
            : "View your current academic syllabus and curriculum guidelines."}
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading syllabus data...</div>
      ) : syllabusList.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          No syllabus documents found for your current semester.
        </div>
      ) : (
        <div className="space-y-6">
          {syllabusList.map((syll) => (
            <div key={syll._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{syll.title}</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                    {syll.branch} • {syll.semester} • {syll.subject}
                  </p>
                </div>
                {isAdmin && editingId !== syll._id && (
                  <button 
                    onClick={() => startEdit(syll)}
                    className="flex items-center text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" /> Edit Syllabus
                  </button>
                )}
              </div>
              
              <div className="p-5">
                {editingId === syll._id ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 p-4 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm leading-relaxed"
                      placeholder="Enter syllabus content here..."
                    />
                    <div className="flex justify-end gap-3 mt-4">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex items-center px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 mr-1.5" /> Cancel
                      </button>
                      <button 
                        onClick={() => saveEdit(syll._id)}
                        className="flex items-center px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                      >
                        <Save className="w-4 h-4 mr-1.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden">
                    {syll.file_url ? (
                      <iframe
                        src={`http://localhost:5000${syll.file_url}`}
                        className="w-full h-[60vh] border-0"
                        title="Syllabus PDF"
                      />
                    ) : syll.file_name && syll.file_name.toUpperCase().endsWith('PDF') ? (
                      <iframe
                        src={`http://localhost:5000/api/files/${encodeURIComponent(syll.file_name)}`}
                        className="w-full h-[60vh] border-0"
                        title="Syllabus PDF"
                      />
                    ) : (
                      <div className="p-10 text-center bg-slate-50">
                        <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">Preview not available for this file type.</p>
                      </div>
                    )}
                    {syll.file_url ? (
                      <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
                        <a
                          href={`${BASE_URL}${syll.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          View Official Syllabus
                        </a>
                      </div>
                    ) : syll.file_name && (
                      <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
                        <a
                          href={`${BASE_URL}/api/files/${encodeURIComponent(syll.file_name)}`}
                          download
                          className="px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          Download Official Syllabus
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
