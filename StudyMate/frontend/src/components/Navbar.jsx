import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200">
          <img src="https://www.rcpit.ac.in/uploads/1599837268.png" alt="RCPIT Logo" className="h-8 w-8 object-contain" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-slate-900">RCPIT StudyMate</span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
              {user?.role === 'admin' ? 'Admin Portal' : 'Student Hub'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">An Autonomous Institute | Affiliated to DBATU</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
          <span className="text-xs text-slate-500">
            {user?.branch} • {user?.semester}
          </span>
        </div>

        <button 
          onClick={() => navigate('/profile')}
          title="View Profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 overflow-hidden hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 transition-all cursor-pointer border border-slate-200"
        >
          {user?.profile_pic ? (
            <img src={user.profile_pic} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </button>

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