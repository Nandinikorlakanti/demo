
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { WorkspaceDashboard } from './components/workspace/WorkspaceDashboard';
import { Header } from './components/layout/Header';
import './styles/theme.css';

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  if (!user) {
    return <AuthPage />;
  }

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header 
          user={user} 
          onLogout={logout}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          isDark={isDarkMode}
        />
        <WorkspaceDashboard onSelectWorkspace={setCurrentWorkspace} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header 
        user={user} 
        onLogout={logout}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        isDark={isDarkMode}
      />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-lg p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              Welcome to {currentWorkspace.name}
            </h1>
            <p className="text-slate-600 mb-6">{currentWorkspace.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Documents</h3>
                <p className="text-3xl font-bold text-blue-600">{currentWorkspace.documentCount}</p>
              </div>
              
              <div className="glass rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Members</h3>
                <p className="text-3xl font-bold text-purple-600">{currentWorkspace.memberCount}</p>
              </div>
              
              <div className="glass rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Last Access</h3>
                <p className="text-lg text-slate-600">{currentWorkspace.lastAccessed}</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentWorkspace(null)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors duration-200"
              >
                Back to Workspaces
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
