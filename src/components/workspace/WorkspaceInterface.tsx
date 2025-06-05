
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { FileSidebar } from './FileSidebar';
import { FileEditor } from './FileEditor';
import { AIAgents } from './AIAgents';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Workspace = Tables<'workspaces'>;
type File = Tables<'files'>;

interface WorkspaceInterfaceProps {
  workspace: Workspace;
  onBack: () => void;
}

export const WorkspaceInterface = ({ workspace, onBack }: WorkspaceInterfaceProps) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [workspace.id]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileCreate = async (name: string, type: 'document' | 'folder') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .insert({
          workspace_id: workspace.id,
          name,
          type: type === 'folder' ? 'document' : 'document',
          is_folder: type === 'folder',
          created_by: user.id,
          content: type === 'document' ? { blocks: [] } : null
        })
        .select()
        .single();

      if (error) throw error;
      setFiles(prev => [data, ...prev]);
      if (type === 'document') {
        setSelectedFile(data);
      }
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileUpdate = async (fileId: string, content: any) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', fileId);

      if (error) throw error;
      
      // Update local state
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, content, updated_at: new Date().toISOString() } : f
      ));
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      
      setFiles(prev => prev.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{workspace.name}</h1>
              <p className="text-slate-600">{workspace.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 pt-20 border-r bg-white/50">
        <FileSidebar
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onFileCreate={handleFileCreate}
          onFileDelete={handleFileDelete}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-20">
        {selectedFile ? (
          <FileEditor
            file={selectedFile}
            onUpdate={handleFileUpdate}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Welcome to {workspace.name}
              </h3>
              <p className="text-slate-500">
                Select a file from the sidebar or create a new one to get started
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Agents */}
      <AIAgents workspaceId={workspace.id} />
    </div>
  );
};
