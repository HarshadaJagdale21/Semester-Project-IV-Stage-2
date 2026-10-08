import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  FileQuestion,
  BookOpen,
  FolderGit2,
  BookmarkCheck,
  GraduationCap,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/syllabus', label: 'AIML Syllabus', icon: BookOpen },
    { to: '/ai-hub', label: 'AI Agents Hub', icon: Brain },
    { to: '/aptitude', label: 'Aptitude Test', icon: FileQuestion },
    { to: '/resources', label: 'Academic Resources', icon: BookOpen },
    { to: '/projects', label: 'Project Ideas', icon: FolderGit2 },
    { to: '/books', label: 'Book Recommendations', icon: BookmarkCheck }
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Academic Modules
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-center">
        <GraduationCap className="h-6 w-6 text-indigo-600 mx-auto mb-1" />
        <p className="text-[11px] font-bold text-slate-800">RCPIT Shirpur</p>
        <p className="text-[10px] text-slate-500">{user?.branch} • {user?.semester}</p>
      </div>
    </aside>
  );
};