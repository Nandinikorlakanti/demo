
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Network } from 'lucide-react';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { WorkspaceCard } from './WorkspaceCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Workspace = Tables<'workspaces'> & {
  memberCount: number;
  documentCount: number;
  lastAccessed: string;
  isOwner: boolean;
};

interface WorkspaceDashboardProps {
  onSelectWorkspace: (workspace: Workspace) => void;
  onOpenGraphBuilder: () => void;
}

export const WorkspaceDashboard = ({ onSelectWorkspace, onOpenGraphBuilder }: WorkspaceDashboardProps) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  const loadWorkspaces = async () => {
    if (!user) return;
    
    try {
      console.log('Loading workspaces for user:', user.id);
      
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading workspaces:', error);
        throw error;
      }

      console.log('Loaded workspaces:', data);
      
      // Transform data to match expected type
      const transformedWorkspaces: Workspace[] = (data || []).map(workspace => ({
        ...workspace,
        memberCount: 1, // Owner is always a member
        documentCount: 0, // Will be loaded separately if needed
        lastAccessed: workspace.updated_at,
        isOwner: true
      }));

      setWorkspaces(transformedWorkspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (data: { name: string; description: string; color: string }) => {
    if (!user) return;

    try {
      console.log('Creating workspace:', data);
      
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: data.name,
          description: data.description,
          color: data.color,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating workspace:', error);
        throw error;
      }

      console.log('Workspace created:', workspace);
      
      // Transform the new workspace to match expected type
      const newWorkspace: Workspace = {
        ...workspace,
        memberCount: 1,
        documentCount: 0,
        lastAccessed: workspace.created_at,
        isOwner: true
      };

      setWorkspaces(prev => [newWorkspace, ...prev]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Failed to create workspace. Please try again.');
    }
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    // TODO: Implement edit functionality
    console.log('Edit workspace:', workspace);
  };

  const handleDeleteWorkspace = (workspace: Workspace) => {
    // TODO: Implement delete functionality
    console.log('Delete workspace:', workspace);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Workspaces</h1>
          <p className="text-slate-600 mt-2">Organize your documents and collaborate with your team</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={onOpenGraphBuilder} variant="outline">
            <Network className="w-4 h-4 mr-2" />
            Graph Builder
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Workspace
          </Button>
        </div>
      </div>

      {/* Workspaces Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No workspaces yet</h3>
          <p className="text-slate-500 mb-6">Create your first workspace to get started</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onOpen={onSelectWorkspace}
              onEdit={handleEditWorkspace}
              onDelete={handleDeleteWorkspace}
            />
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWorkspace}
      />
    </div>
  );
};
