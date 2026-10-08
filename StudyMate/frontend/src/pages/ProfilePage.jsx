import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { Camera, Save, User, Mail, BookOpen, GraduationCap, Phone, Hash } from 'lucide-react';
import api from '../api/client';

export const ProfilePage = () => {
  const { user } = useAuth();
  
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
      await api.put('/auth/me', formData);
      setMsg("Profile updated successfully!");
      // Reload page to reflect changes globally
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setMsg("Error updating profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your academic identity and personal information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - ID Card View */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
            <div className="px-6 pb-6 relative flex flex-col items-center">
              <div className="h-28 w-28 rounded-full bg-white border-4 border-white shadow-xl -mt-14 overflow-hidden flex items-center justify-center mb-4">
                {user?.profile_pic ? (
                  <img src={user.profile_pic} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-slate-300" />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-center">{user?.name}</h2>
              <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-2 uppercase tracking-wider">
                {user?.role === 'admin' ? 'Administrator' : 'Student'}
              </p>
              
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Mail className="h-4 w-4 mr-3 text-slate-400" />
                  <span className="truncate font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <GraduationCap className="h-4 w-4 mr-3 text-slate-400" />
                  <span className="font-medium">{user?.branch} • {user?.semester}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Hash className="h-4 w-4 mr-3 text-slate-400" />
                  <span className="font-medium">PRN: {user?.prn || 'Not Set'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Edit Details</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Avatar URL */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Avatar URL (Profile Picture)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Camera className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="profile_pic" 
                    value={formData.profile_pic} 
                    onChange={handleChange}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full rounded-xl border border-slate-200 pl-10 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-shadow bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Paste a direct link to an image file.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-shadow bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX"
                      className="w-full rounded-xl border border-slate-200 pl-10 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-shadow bg-slate-50 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PRN Number</label>
                  <input 
                    type="text" name="prn" value={formData.prn} onChange={handleChange} placeholder="e.g. 2021033..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-shadow bg-slate-50 uppercase font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Roll No.</label>
                  <input 
                    type="text" name="roll_no" value={formData.roll_no} onChange={handleChange} placeholder="e.g. A-42"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-shadow bg-slate-50 uppercase font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bio & Academic Goals</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </div>
                  <textarea 
                    name="bio" value={formData.bio} onChange={handleChange} rows="4" placeholder="Tell us about your academic interests..."
                    className="w-full rounded-xl border border-slate-200 pl-10 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-shadow bg-slate-50 font-medium resize-none"
                  ></textarea>
                </div>
              </div>

              {msg && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center ${msg.includes('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  {msg}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button type="submit" disabled={loading} className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center shadow-md shadow-indigo-200">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
