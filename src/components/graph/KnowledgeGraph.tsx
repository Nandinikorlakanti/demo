
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type File = Tables<'files'>;
type KnowledgeLink = Tables<'knowledge_links'>;

interface GraphNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  x: number;
  y: number;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

interface KnowledgeGraphProps {
  workspaceId: string;
}

export const KnowledgeGraph = ({ workspaceId }: KnowledgeGraphProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<KnowledgeLink[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, [workspaceId]);

  const loadGraphData = async () => {
    try {
      // Load files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (filesError) throw filesError;

      // Load knowledge links
      const { data: linksData, error: linksError } = await supabase
        .from('knowledge_links')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (linksError) throw linksError;

      setFiles(filesData || []);
      setLinks(linksData || []);
      
      // Generate graph visualization data
      generateGraphData(filesData || [], linksData || []);
    } catch (error) {
      console.error('Error loading graph data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateGraphData = (files: File[], links: KnowledgeLink[]) => {
    // Create nodes from files
    const graphNodes: GraphNode[] = files.map((file, index) => {
      const angle = (index / files.length) * 2 * Math.PI;
      const radius = 200;
      return {
        id: file.id,
        name: file.name,
        type: file.is_folder ? 'folder' : 'file',
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle)
      };
    });

    // Create links from knowledge links
    const graphLinks: GraphLink[] = links.map(link => ({
      source: link.source_file_id,
      target: link.target_file_id,
      strength: link.strength_score
    }));

    setNodes(graphNodes);
    setGraphLinks(graphLinks);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No files found in this workspace</p>
          <p className="text-sm text-slate-400">Create some files to see knowledge connections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Knowledge Graph Visualization</h3>
        <p className="text-sm text-slate-600">
          Showing {nodes.length} nodes and {graphLinks.length} connections
        </p>
      </div>
      
      <div className="relative">
        <svg width="800" height="600" className="border">
          {/* Render links */}
          {graphLinks.map((link, index) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);
            
            if (!sourceNode || !targetNode) return null;
            
            return (
              <line
                key={index}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#cbd5e1"
                strokeWidth={Math.max(1, link.strength * 3)}
                opacity={0.6}
              />
            );
          })}
          
          {/* Render nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === 'folder' ? 12 : 8}
                fill={node.type === 'folder' ? '#f59e0b' : '#3b82f6'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80"
              />
              <text
                x={node.x}
                y={node.y + 25}
                textAnchor="middle"
                className="text-xs fill-slate-600"
                style={{ fontSize: '10px' }}
              >
                {node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name}
              </text>
            </g>
          ))}
        </svg>
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded border shadow-sm">
          <h4 className="text-sm font-semibold mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Files</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span>Folders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-slate-300"></div>
              <span>Connections</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
