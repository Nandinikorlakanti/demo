
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  File, 
  Folder, 
  Search, 
  MoreHorizontal,
  FileText,
  Upload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type File = Tables<'files'>;

interface FileSidebarProps {
  files: File[];
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onFileCreate: (name: string, type: 'document' | 'folder') => void;
  onFileDelete: (fileId: string) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  workspaceId: string;
}

export const FileSidebar = ({
  files,
  selectedFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileUpload,
  isLoading,
  workspaceId
}: FileSidebarProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [createType, setCreateType] = useState<'document' | 'folder'>('document');
  const [isUploading, setIsUploading] = useState(false);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim(), createType);
      setNewFileName('');
      setShowCreateDialog(false);
    }
  };

  const readFileContent = (file: globalThis.File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || !user) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(uploadedFiles)) {
        console.log('Uploading file:', file.name);
        
        // Read file content
        let content = null;
        try {
          const fileContent = await readFileContent(file);
          // Create blocks from file content for text files
          if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            content = {
              blocks: [{
                id: Date.now().toString(),
                type: 'text',
                content: fileContent
              }]
            };
          }
        } catch (error) {
          console.warn('Could not read file content:', error);
        }
        
        // Create file record in database
        const { data: fileRecord, error: dbError } = await supabase
          .from('files')
          .insert({
            workspace_id: workspaceId,
            name: file.name,
            type: 'document',
            size_bytes: file.size,
            created_by: user.id,
            is_folder: false,
            content: content
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          throw dbError;
        }

        console.log('File record created:', fileRecord);
        onFileUpload(fileRecord);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.is_folder) return Folder;
    switch (file.type) {
      case 'document':
        return FileText;
      default:
        return File;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Files</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-name">Name</Label>
                  <Input
                    id="file-name"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Enter file name"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={createType === 'document' ? 'default' : 'outline'}
                    onClick={() => setCreateType('document')}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Document
                  </Button>
                  <Button
                    variant={createType === 'folder' ? 'default' : 'outline'}
                    onClick={() => setCreateType('folder')}
                    className="flex-1"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    Folder
                  </Button>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500">Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            {searchQuery ? 'No files match your search' : 'No files yet'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredFiles.map((file) => {
              const IconComponent = getFileIcon(file);
              return (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ${
                    selectedFile?.id === file.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <IconComponent className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {file.name}
                    </span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-6 h-6">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onFileDelete(file.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="p-4 border-t">
        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <Button variant="outline" className="w-full" disabled={isUploading}>
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </div>
    </div>
  );
};
