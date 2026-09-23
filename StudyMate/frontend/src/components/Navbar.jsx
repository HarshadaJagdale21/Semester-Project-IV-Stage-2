import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-900">StudyMate</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
            {user?.role === 'admin' ? 'Admin Portal' : 'Student Hub'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
          <span className="text-xs text-slate-500">
            {user?.branch} • {user?.semester}
          </span>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <User className="h-4 w-4" />
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};