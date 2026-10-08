import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { BookmarkCheck } from 'lucide-react';

export const BooksHub = () => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    api.get('/books').then((res) => setBooks(res.data));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Academic Reference Books</h1>
        <p className="text-xs text-slate-500 mt-1">Recommended standard engineering textbooks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {books.map((b) => (
          <div key={b._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                {b.subject}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-2">{b.title}</h2>
              <p className="text-xs text-slate-400 font-medium mb-2">By {b.author}</p>
              {b.description && <p className="text-xs text-slate-600 mb-3">{b.description}</p>}
              {b.recommendation_reason && (
                <div className="text-[11px] font-semibold text-indigo-600 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100 mb-4">
                  Why Recommended: {b.recommendation_reason}
                </div>
              )}
            </div>
            
            {b.link && (
              <a 
                href={b.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Access E-Book
              </a>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};