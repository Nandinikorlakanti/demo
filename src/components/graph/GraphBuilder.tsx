
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Network, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { KnowledgeGraph } from './KnowledgeGraph';
import type { Tables } from '@/integrations/supabase/types';

type Workspace = Tables<'workspaces'>;

interface GraphBuilderProps {
  onBack: () => void;
}

export const GraphBuilder = ({ onBack }: GraphBuilderProps) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkspaces(data || []);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGraph = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Graph Builder</h1>
              <p className="text-slate-600">Visualize knowledge connections in your workspaces</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!selectedWorkspace ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Network className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Choose a Workspace to Generate Graph
              </h2>
              <p className="text-slate-500">
                Select a workspace to visualize the knowledge connections between your documents
              </p>
            </div>

            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-64" disabled={isLoading}>
                    {isLoading ? 'Loading workspaces...' : 'Select Workspace'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  {workspaces.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No workspaces found
                    </DropdownMenuItem>
                  ) : (
                    workspaces.map((workspace) => (
                      <DropdownMenuItem
                        key={workspace.id}
                        onClick={() => handleGenerateGraph(workspace)}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: workspace.color }}
                          />
                          <span>{workspace.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => setSelectedWorkspace(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Selection
                </Button>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    Knowledge Graph: {selectedWorkspace.name}
                  </h2>
                  <p className="text-slate-600">{selectedWorkspace.description}</p>
                </div>
              </div>
            </div>
            
            <KnowledgeGraph workspaceId={selectedWorkspace.id} />
          </div>
        )}
      </div>
    </div>
  );
};
