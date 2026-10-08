import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';
import { AiHub } from './pages/AiHub';
import { AptitudeTest } from './pages/AptitudeTest';
import { AcademicResources } from './pages/AcademicResources';
import { ProjectsHub } from './pages/ProjectsHub';
import { BooksHub } from './pages/BooksHub';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminStudentProfile } from './pages/AdminStudentProfile';
import { SyllabusManager } from './pages/SyllabusManager';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Student Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-hub"
            element={
              <ProtectedRoute requiredRole="student">
                <AiHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aptitude"
            element={
              <ProtectedRoute requiredRole="student">
                <AptitudeTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute requiredRole="student">
                <AcademicResources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute requiredRole="student">
                <ProjectsHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books"
            element={
              <ProtectedRoute requiredRole="student">
                <BooksHub />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminStudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/syllabus"
            element={
              <ProtectedRoute>
                <SyllabusManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <ProtectedRoute requiredRole="admin">
                <AcademicResources />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}