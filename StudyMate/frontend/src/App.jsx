import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

const StudentDashboardPlaceholder = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Student Dashboard (Module 2 Loading...)</h1>
    <p className="mt-2 text-slate-600">Authentication successful!</p>
  </div>
);

const AdminDashboardPlaceholder = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Admin Dashboard (Module 3 Loading...)</h1>
    <p className="mt-2 text-slate-600">Admin privileges verified!</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboardPlaceholder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPlaceholder />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}