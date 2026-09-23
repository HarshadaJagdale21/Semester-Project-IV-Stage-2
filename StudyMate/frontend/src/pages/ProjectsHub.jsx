import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FolderGit2, Layers } from 'lucide-react';

export const ProjectsHub = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(res.data));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Capstone & Engineering Project Hub</h1>
        <p className="text-xs text-slate-500 mt-1">Curated ideas spanning AI, Computer Vision, and Full-Stack systems</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((p) => (
          <div key={p._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                  {p.domain}
                </span>
                <span className="text-xs font-semibold text-slate-500">{p.difficulty}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-2">{p.title}</h2>
              <p className="text-xs text-slate-600 mb-4">{p.abstract}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.technologies?.map((tech, i) => (
                  <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Expected Output: {p.expected_output}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};