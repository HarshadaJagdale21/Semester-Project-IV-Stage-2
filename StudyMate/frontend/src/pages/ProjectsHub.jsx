import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FolderGit2, Layers, CheckCircle } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const ProjectsHub = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    // Only fetch projects relevant to this student's branch (or ALL if admin)
    api.get(`/projects?branch=${user?.branch || 'ALL'}`).then((res) => setProjects(res.data));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Capstone & Engineering Project Hub</h1>
        <p className="text-xs text-slate-500 mt-1">Curated ideas spanning AI, Computer Vision, Web3, and Full-Stack systems</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div 
            key={p._id} 
            onClick={() => setSelectedProject(p)}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {p.domain}
                </span>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600">{p.difficulty}</span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 mb-2 leading-tight group-hover:text-indigo-700 transition-colors">{p.title}</h2>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{p.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <Layers className="w-4 h-4" /> View Details →
            </div>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full mb-3 inline-block">
                  {selectedProject.domain} • {selectedProject.difficulty}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight pr-8">{selectedProject.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedProject(null)} 
                className="text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200 p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Project Abstract</h3>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{selectedProject.description}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tech?.map((tech, i) => (
                    <span key={i} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Expected Output
                </h3>
                <p className="text-sm text-emerald-900 font-semibold">{selectedProject.expected_output || 'A functional end-to-end system based on the specified requirements.'}</p>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedProject(null)} 
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 shadow-md transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};