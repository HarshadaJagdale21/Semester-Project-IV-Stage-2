import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, User, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('AIML');
  const [year, setYear] = useState('2024');
  const [semester, setSemester] = useState('Semester 5');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const user = await register({
          name,
          email,
          password,
          branch,
          year,
          semester,
          role: 'student'
        });
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        const user = await login(email, password);
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">StudyMate</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-Agent Academic Assistance System</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            RCPIT Academic Portal 2026
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Patil"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">College Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student.aiml@rcpit.ac.in"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          {isRegister && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value="AIML">AIML</option>
                  <option value="CSE">CSE</option>
                  <option value="DS">DS</option>
                  <option value="IT">IT</option>
                  <option value="ENTC">ENTC</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                  <option value="EE">EE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Batch</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sem</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value="Semester 3">Sem 3</option>
                  <option value="Semester 4">Sem 4</option>
                  <option value="Semester 5">Sem 5</option>
                  <option value="Semester 6">Sem 6</option>
                  <option value="Semester 7">Sem 7</option>
                  <option value="Semester 8">Sem 8</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none disabled:opacity-50 transition-colors"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Student Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsRegister(false)} className="font-semibold text-indigo-600 hover:underline">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New student?{' '}
              <button onClick={() => setIsRegister(true)} className="font-semibold text-indigo-600 hover:underline">
                Register here
              </button>
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-400">Demo Seed Logins:</p>
          <p className="text-xs text-slate-500 mt-1">Admin: <span className="font-mono text-slate-700">admin@rcpit.ac.in</span> / <span className="font-mono text-slate-700">Admin@Rcpit2026</span></p>
          <p className="text-xs text-slate-500">Student: <span className="font-mono text-slate-700">student.aiml@rcpit.ac.in</span> / <span className="font-mono text-slate-700">Student@2026</span></p>
        </div>
      </div>
    </div>
  );
};