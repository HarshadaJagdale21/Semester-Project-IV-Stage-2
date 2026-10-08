import React, { useState } from 'react';
import { X, Camera, Save, User } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ProfileModal = ({ onClose }) => {
  const { user, login } = useAuth(); // login is often used in context to update the stored user, wait, I'll need to see how AuthContext is written. But I can just do a page reload after update for safety.
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    prn: user?.prn || '',
    roll_no: user?.roll_no || '',
    profile_pic: user?.profile_pic || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await api.put('/auth/me', formData);
      setMsg("Profile updated successfully! Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setMsg("Error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Edit Profile settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center mb-3">
              {formData.profile_pic ? (
                <img src={formData.profile_pic} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div className="w-full relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-center">Avatar URL</label>
              <input 
                type="text" 
                name="profile_pic" 
                value={formData.profile_pic} 
                onChange={handleChange}
                placeholder="Paste an image URL..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <input 
                type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
              <input 
                type="text" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">PRN Number</label>
              <input 
                type="text" name="prn" value={formData.prn} onChange={handleChange} placeholder="e.g. 2021033..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Roll No.</label>
              <input 
                type="text" name="roll_no" value={formData.roll_no} onChange={handleChange} placeholder="e.g. A-42"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Bio / Academic Interests</label>
            <textarea 
              name="bio" value={formData.bio} onChange={handleChange} rows="2"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
            ></textarea>
          </div>

          {msg && (
            <div className={`p-3 mb-4 rounded-lg text-sm font-bold text-center ${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {msg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
