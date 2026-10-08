import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ArrowLeft, User, Mail, BookOpen, GraduationCap, Clock, CheckCircle, XCircle } from 'lucide-react';

export const AdminStudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/admin/students/${id}`);
        setStudent(res.data);
      } catch (err) {
        alert("Failed to load student profile");
        navigate('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-500 font-medium">Loading comprehensive profile...</div>
      </DashboardLayout>
    );
  }

  if (!student) return null;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4">
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="self-start text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Command Center
        </button>
        
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">{student.name}</h1>
              <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4" /> {student.email}
                <span className="text-slate-300">|</span>
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">{student.role}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (window.confirm("Are you absolutely sure you want to permanently delete this student account?")) {
                  try {
                    await api.delete(`/admin/students/${student._id}`);
                    alert("Student removed successfully.");
                    navigate('/admin/dashboard');
                  } catch (err) {
                    alert("Failed to remove student.");
                  }
                }
              }}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Remove Student
            </button>
            <button
              onClick={async () => {
                if (window.confirm("You are about to log in as this student to view their exact portal experience. You will need to log back in as Admin afterwards. Proceed?")) {
                  try {
                    const res = await api.post(`/admin/impersonate/${student._id}`);
                    localStorage.setItem('studymate_token', res.data.token);
                    localStorage.setItem('studymate_user', JSON.stringify(res.data.user));
                    window.location.href = '/dashboard';
                  } catch (err) {
                    alert("Failed to impersonate student.");
                  }
                }
              }}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" /> View Portal as Student
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="w-4 h-4" /> Branch
          </div>
          <div className="text-xl font-bold text-slate-900">{student.branch}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <GraduationCap className="w-4 h-4" /> Semester
          </div>
          <div className="text-xl font-bold text-slate-900">{student.semester}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <User className="w-4 h-4" /> Enrollment ID
          </div>
          <div className="text-xl font-bold text-slate-900">{student.enrollment_number || "N/A"}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden mb-8 relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <div className="p-6 border-b border-red-100 bg-red-50/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-red-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Admin Security Clearance
            </h2>
            <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-widest">Confidential Student Data & Credentials</p>
          </div>
        </div>
        <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Password</div>
              <div className="text-lg font-mono font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 inline-block selection:bg-red-200">
                {student.password_clear || "Encrypted (No Plaintext Found)"}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</div>
              <div className="text-sm font-semibold text-slate-800">{student.phone || "Not provided"}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">University PRN</div>
              <div className="text-sm font-semibold text-slate-800">{student.prn || "Not provided"}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Roll Number</div>
              <div className="text-sm font-semibold text-slate-800">{student.roll_no || "Not provided"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Comprehensive Testing History</h2>
          <p className="text-xs text-slate-500 mt-1">Detailed log of all aptitude tests taken by {student.name}</p>
        </div>
        
        {student.attempts && student.attempts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {student.attempts.map((attempt) => (
              <div key={attempt._id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{attempt.test_title}</h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> 
                      {new Date(attempt.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-indigo-600">{attempt.score} <span className="text-sm text-slate-400 font-bold">/ {attempt.total}</span></div>
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full mt-1 inline-block">
                      Accuracy: {attempt.accuracy}%
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Question Breakdown</h4>
                  <div className="space-y-3">
                    {attempt.detailed_results?.map((res, idx) => (
                      <div key={idx} className="text-sm p-4 rounded-xl border border-slate-100 bg-white">
                        <div className="font-semibold text-slate-800 mb-2">{idx + 1}. {res.question}</div>
                        <div className="flex items-center gap-2 text-xs font-medium mb-1">
                          <span className="text-slate-500 w-16">Your Ans:</span>
                          {res.is_correct ? (
                            <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded"><CheckCircle className="w-3 h-3"/> {res.selected}</span>
                          ) : (
                            <span className="text-red-700 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded"><XCircle className="w-3 h-3"/> {res.selected}</span>
                          )}
                        </div>
                        {!res.is_correct && (
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="text-slate-500 w-16">Correct:</span>
                            <span className="text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded"><CheckCircle className="w-3 h-3"/> {res.correct}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 font-medium">
            This student has not attempted any tests yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
