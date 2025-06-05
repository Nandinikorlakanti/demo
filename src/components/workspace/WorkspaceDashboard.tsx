
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Grid, List } from 'lucide-react';
import { WorkspaceCard } from './WorkspaceCard';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
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
}

export const WorkspaceDashboard = ({ onSelectWorkspace }: WorkspaceDashboardProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  const loadWorkspaces = async () => {
    if (!user) return;

    try {
      console.log('Loading workspaces for user:', user.id);
      
      // First get workspaces where user is owner
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) {
        console.error('Error loading owned workspaces:', ownedError);
        throw ownedError;
      }

      // Then get workspaces where user is a member
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!inner(role)
        `)
        .eq('workspace_members.user_id', user.id);

      if (memberError) {
        console.error('Error loading member workspaces:', memberError);
        throw memberError;
      }

      // Combine and deduplicate workspaces
      const allWorkspaces = [...(ownedWorkspaces || []), ...(memberWorkspaces || [])];
      const uniqueWorkspaces = allWorkspaces.filter((workspace, index, self) => 
        index === self.findIndex((w) => w.id === workspace.id)
      );

      console.log('Found workspaces:', uniqueWorkspaces);

      // Get additional data for each workspace
      const enrichedWorkspaces = await Promise.all(
        uniqueWorkspaces.map(async (workspace) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('workspace_members')
            .select('*', { count: 'exact' })
            .eq('workspace_id', workspace.id);

          // Get document count
          const { count: documentCount } = await supabase
            .from('files')
            .select('*', { count: 'exact' })
            .eq('workspace_id', workspace.id)
            .eq('is_folder', false);

          // Check if user is owner
          const isOwner = workspace.owner_id === user.id;

          return {
            ...workspace,
            memberCount: (memberCount || 0) + 1, // +1 for the owner
            documentCount: documentCount || 0,
            lastAccessed: new Date(workspace.updated_at).toLocaleDateString(),
            isOwner
          };
        })
      );

      console.log('Enriched workspaces:', enrichedWorkspaces);
      setWorkspaces(enrichedWorkspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkspace = async (workspaceData: { name: string; description: string; color: string }) => {
    if (!user) return;

    try {
      console.log('Creating workspace:', workspaceData);
      
      const { data: newWorkspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceData.name,
          description: workspaceData.description,
          color: workspaceData.color,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating workspace:', error);
        throw error;
      }

      console.log('Created workspace:', newWorkspace);

      // Add user as workspace member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: newWorkspace.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        // Continue anyway, as the workspace was created
      }

      // Reload workspaces
      await loadWorkspaces();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Failed to create workspace. Please try again.');
    }
  };

  const handleDeleteWorkspace = async (workspace: Workspace) => {
    if (!workspace.isOwner) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace.id);

      if (error) throw error;
      
      // Remove from local state
      setWorkspaces(prev => prev.filter(w => w.id !== workspace.id));
    } catch (error) {
      console.error('Error deleting workspace:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Your Workspaces</h1>
            <p className="text-slate-600">Manage and access your collaborative workspaces</p>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ripple"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Workspace
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 bg-white/50 glass"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredWorkspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onOpen={onSelectWorkspace}
              onEdit={(w) => console.log('Edit workspace:', w)}
              onDelete={handleDeleteWorkspace}
            />
          ))}
        </div>

        {filteredWorkspaces.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">
              {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="outline"
            >
              Create your first workspace
            </Button>
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWorkspace}
      />
    </div>
  );
};
