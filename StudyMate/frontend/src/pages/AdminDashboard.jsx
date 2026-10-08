import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Users, FileText, BookOpen, Award, CheckCircle, Upload, PlusCircle } from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ name: '', email: '', password: '', branch: 'AIML', semester: 'Semester 5' });

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    subject: '',
    branch: 'AIML',
    semester: 'Semester 1',
    unit: 'Unit 1',
    type: 'notes'
  });

  // Aptitude state
  const [aptitudeData, setAptitudeData] = useState({
    category: 'Quantitative Aptitude',
    topic: '',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: ''
  });

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
        console.error('Admin authorization check failed.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert('Please select a file to upload');

    const formData = new FormData();
    formData.append('file', uploadFile);
    Object.keys(uploadData).forEach(key => formData.append(key, uploadData[key]));

    try {
      await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Resource uploaded successfully!');
      setUploadFile(null);
      setUploadData({ ...uploadData, title: '' });
    } catch (err) {
      alert('Failed to upload resource');
    }
  };

  const handleAptitudeSubmit = async (e) => {
    e.preventDefault();
    if (!aptitudeData.question || !aptitudeData.correct_answer) return alert('Please fill required fields');
    
    try {
      await api.post('/admin/aptitude', aptitudeData);
      alert('Aptitude question added successfully!');
      setAptitudeData({
        ...aptitudeData,
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: ''
      });
    } catch (err) {
      alert('Failed to add aptitude question');
    }
  };

  const handleRemoveStudent = async (id) => {
    if(!window.confirm("Are you sure you want to permanently remove this student?")) return;
    try {
      await api.delete(`/admin/students/${id}`);
      setStudents(students.filter(s => s._id !== id));
      setSelectedStudent(null);
      alert("Student removed successfully.");
    } catch (err) {
      alert("Failed to remove student.");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/students', newStudentData);
      const res = await api.get('/admin/students');
      setStudents(res.data);
      setShowAddStudent(false);
      alert("Student added successfully!");
      setNewStudentData({ name: '', email: '', password: '', branch: 'AIML', semester: 'Semester 5' });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add student.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500">Verifying administrative access...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Administrator Command Center</h1>
        <p className="text-sm text-slate-500 mt-1">Manage institutional knowledge, monitor student testing, and audit performance</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 font-semibold text-sm border-b-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          View Students
        </button>
        <button
          onClick={() => { setActiveTab('upload_syllabus'); setUploadData({...uploadData, type: 'syllabus'}); }}
          className={`pb-2 px-1 font-semibold text-sm border-b-2 ${activeTab === 'upload_syllabus' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Upload Syllabus
        </button>
        <button
          onClick={() => { setActiveTab('upload_notes'); setUploadData({...uploadData, type: 'notes'}); }}
          className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'upload_notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-1.5"><FileText className="w-4 h-4"/> Upload Notes</div>
        </button>
        <button
          onClick={() => { setActiveTab('upload_syllabus'); setUploadData({...uploadData, type: 'syllabus'}); }}
          className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'upload_syllabus' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4"/> Upload Syllabus</div>
        </button>
        <button
          onClick={() => { setActiveTab('upload_pyq'); setUploadData({...uploadData, type: 'pyqs'}); }}
          className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'upload_pyq' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-1.5"><Upload className="w-4 h-4"/> Upload PYQs</div>
        </button>
        <button
          onClick={() => setActiveTab('aptitude')}
          className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'aptitude' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4"/> Manage Aptitude</div>
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Enrolled Students</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_students || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Notes & Syllabus</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{(stats?.total_notes || 0) + (stats?.total_syllabus || 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Aptitude Questions</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_questions || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Total Test Attempts</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_test_attempts || 0}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Student Progress & Evaluation Audit</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddStudent(true)}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Add Student
                </button>
                <select 
                  value={selectedBranch} 
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Branches</option>
                  <option value="AIML">AIML</option>
                  <option value="CSE">CSE</option>
                  <option value="DS">Data Science</option>
                  <option value="IT">IT</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">Last Test Score</th>
                    <th className="p-4">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.filter(s => selectedBranch === 'ALL' || s.branch === selectedBranch).map((s) => (
                    <tr 
                      key={s._id} 
                      onClick={() => window.open(`/admin/students/${s._id}`, '_blank')}
                      className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="p-4 font-bold text-slate-800 group-hover:text-indigo-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                        {s.name}
                      </td>
                      <td className="p-4 text-slate-500">{s.email}</td>
                      <td className="p-4 font-medium text-slate-600">{s.branch}</td>
                      <td className="p-4 font-semibold">{s.last_score}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                          {s.accuracy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Student Modal */}
          {showAddStudent && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-900">Add New Student</h2>
                  <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
                    <input type="text" required value={newStudentData.name} onChange={e => setNewStudentData({...newStudentData, name: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address</label>
                    <input type="email" required value={newStudentData.email} onChange={e => setNewStudentData({...newStudentData, email: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Temporary Password</label>
                    <input type="text" required value={newStudentData.password} onChange={e => setNewStudentData({...newStudentData, password: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Branch</label>
                      <select value={newStudentData.branch} onChange={e => setNewStudentData({...newStudentData, branch: e.target.value})} className="w-full p-2 border rounded-lg bg-white outline-none text-sm">
                        <option value="AIML">AIML</option>
                        <option value="CSE">CSE</option>
                        <option value="IT">IT</option>
                        <option value="DS">Data Science</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Semester</label>
                      <select value={newStudentData.semester} onChange={e => setNewStudentData({...newStudentData, semester: e.target.value})} className="w-full p-2 border rounded-lg bg-white outline-none text-sm">
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`Semester ${s}`}>Sem {s}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-4 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition">Create Account</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dynamic Upload Tab Content */}
      {(activeTab === 'upload_notes' || activeTab === 'upload_syllabus' || activeTab === 'upload_pyq') && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              {activeTab === 'upload_notes' ? <FileText className="w-6 h-6" /> : activeTab === 'upload_syllabus' ? <BookOpen className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === 'upload_notes' ? "Upload New Lecture Notes" : activeTab === 'upload_syllabus' ? "Upload Official Syllabus" : "Upload Previous Question Paper"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Distribute academic content directly to student portals based on their exact branch and semester.</p>
            </div>
          </div>
          
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Document Title</label>
                <input required type="text" value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-800" placeholder="e.g. Advanced Operating Systems - Unit 2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Subject Name</label>
                <input required type="text" value={uploadData.subject} onChange={e => setUploadData({...uploadData, subject: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-800" placeholder="e.g. Operating Systems" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Branch</label>
                <select value={uploadData.branch} onChange={e => setUploadData({...uploadData, branch: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold">
                  <option value="AIML">AIML</option>
                  <option value="CSE">CSE</option>
                  <option value="DS">Data Science</option>
                  <option value="IT">IT</option>
                  <option value="ALL">All Branches</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Semester</label>
                <select value={uploadData.semester} onChange={e => setUploadData({...uploadData, semester: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold">
                  {[...Array(8)].map((_, i) => (
                    <option key={i+1} value={`Semester ${i+1}`}>Semester {i+1}</option>
                  ))}
                  <option value="ALL">All Semesters</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {activeTab === 'upload_pyq' ? "Exam Year" : "Unit / Chapter"}
                </label>
                <input required type="text" value={uploadData.unit} onChange={e => setUploadData({...uploadData, unit: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold" placeholder={activeTab === 'upload_pyq' ? "e.g. 2024" : "e.g. Unit 3"} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Upload PDF Document</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-colors bg-slate-50">
                <div className="space-y-2 text-center">
                  <Upload className="mx-auto h-10 w-10 text-slate-400" />
                  <div className="flex text-sm text-slate-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-1">
                      <span>Upload a file</span>
                      <input type="file" accept=".pdf" className="sr-only" onChange={e => setUploadFile(e.target.files[0])} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">PDF files up to 20MB</p>
                  {uploadFile && <p className="text-sm font-bold text-indigo-700 mt-3 bg-indigo-100 inline-block px-3 py-1 rounded-full border border-indigo-200">{uploadFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                <Upload className="w-4 h-4" /> Publish Resource
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'aptitude' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><PlusCircle className="w-5 h-5 mr-2 text-emerald-600"/> Add Aptitude Question</h2>
          <form onSubmit={handleAptitudeSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={aptitudeData.category} onChange={e => setAptitudeData({...aptitudeData, category: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="Verbal Ability">Verbal Ability</option>
                  <option value="Technical Aptitude">Technical Aptitude</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                <input type="text" required value={aptitudeData.topic} onChange={e => setAptitudeData({...aptitudeData, topic: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Percentages" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
              <textarea required rows={3} value={aptitudeData.question} onChange={e => setAptitudeData({...aptitudeData, question: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter question..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map(i => (
                  <input key={i} type="text" required value={aptitudeData.options[i]} onChange={e => {
                    const newOpts = [...aptitudeData.options];
                    newOpts[i] = e.target.value;
                    setAptitudeData({...aptitudeData, options: newOpts});
                  }} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer (Must exactly match one option)</label>
              <input type="text" required value={aptitudeData.correct_answer} onChange={e => setAptitudeData({...aptitudeData, correct_answer: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Correct option text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Explanation (Optional)</label>
              <textarea rows={2} value={aptitudeData.explanation} onChange={e => setAptitudeData({...aptitudeData, explanation: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Explain the solution..." />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors">
              Add Question to Bank
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};