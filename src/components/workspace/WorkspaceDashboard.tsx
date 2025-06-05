
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Grid, List } from 'lucide-react';
import { WorkspaceCard } from './WorkspaceCard';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';

interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  memberCount: number;
  documentCount: number;
  lastAccessed: string;
  isOwner: boolean;
}

interface WorkspaceDashboardProps {
  onSelectWorkspace: (workspace: Workspace) => void;
}

export const WorkspaceDashboard = ({ onSelectWorkspace }: WorkspaceDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data - in real app this would come from API
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: '1',
      name: 'Personal Projects',
      description: 'My personal workspace for side projects and ideas',
      color: '#3B82F6',
      memberCount: 1,
      documentCount: 12,
      lastAccessed: '2 hours ago',
      isOwner: true,
    },
    {
      id: '2',
      name: 'Team Alpha',
      description: 'Collaborative workspace for the Alpha team projects',
      color: '#8B5CF6',
      memberCount: 5,
      documentCount: 28,
      lastAccessed: '1 day ago',
      isOwner: true,
    },
    {
      id: '3',
      name: 'Research & Development',
      description: 'R&D documentation and research materials',
      color: '#10B981',
      memberCount: 8,
      documentCount: 45,
      lastAccessed: '3 days ago',
      isOwner: false,
    },
  ]);

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkspace = (workspaceData: { name: string; description: string; color: string }) => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      ...workspaceData,
      memberCount: 1,
      documentCount: 0,
      lastAccessed: 'Just now',
      isOwner: true,
    };
    setWorkspaces([newWorkspace, ...workspaces]);
    setShowCreateModal(false);
  };

  const handleDeleteWorkspace = (workspace: Workspace) => {
    setWorkspaces(workspaces.filter(w => w.id !== workspace.id));
  };

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

        {filteredWorkspaces.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No workspaces found</p>
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
