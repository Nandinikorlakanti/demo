
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Users, FileText, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface WorkspaceCardProps {
  workspace: Workspace;
  onOpen: (workspace: Workspace) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
}

export const WorkspaceCard = ({ workspace, onOpen, onEdit, onDelete }: WorkspaceCardProps) => {
  return (
    <Card className="group hover-lift cursor-pointer transition-all duration-300 hover:shadow-lg border-0 glass">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
            style={{ backgroundColor: workspace.color }}
          >
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem onClick={() => onEdit(workspace)}>
                Edit workspace
              </DropdownMenuItem>
              {workspace.isOwner && (
                <DropdownMenuItem 
                  onClick={() => onDelete(workspace)}
                  className="text-red-600"
                >
                  Delete workspace
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div onClick={() => onOpen(workspace)} className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{workspace.name}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{workspace.description}</p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{workspace.memberCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>{workspace.documentCount}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{workspace.lastAccessed}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
