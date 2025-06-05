
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { WorkspaceDashboard } from './components/workspace/WorkspaceDashboard';
import { WorkspaceInterface } from './components/workspace/WorkspaceInterface';
import { GraphBuilder } from './components/graph/GraphBuilder';
import { Header } from './components/layout/Header';
import type { Tables } from '@/integrations/supabase/types';
import './styles/theme.css';

const queryClient = new QueryClient();

type Workspace = Tables<'workspaces'> & {
  memberCount: number;
  documentCount: number;
  lastAccessed: string;
  isOwner: boolean;
};

const AppContent = () => {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [showGraphBuilder, setShowGraphBuilder] = useState(false);

  if (!user) {
    return <AuthPage />;
  }

  if (showGraphBuilder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header 
          user={user} 
          onLogout={logout}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          isDark={isDarkMode}
        />
        <GraphBuilder onBack={() => setShowGraphBuilder(false)} />
      </div>
    );
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
        <WorkspaceDashboard 
          onSelectWorkspace={setCurrentWorkspace}
          onOpenGraphBuilder={() => setShowGraphBuilder(true)}
        />
      </div>
    );
  }

  return (
    <WorkspaceInterface 
      workspace={currentWorkspace} 
      onBack={() => setCurrentWorkspace(null)} 
    />
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
