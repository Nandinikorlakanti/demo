import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Tags, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tables } from '@/integrations/supabase/types';

type File = Tables<'files'>;

interface AutoTagGeneratorProps {
  workspaceId: string;
  files?: File[];
}

export const AutoTagGenerator = ({ workspaceId, files = [] }: AutoTagGeneratorProps) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string}>>([]);
  const [fileNameInput, setFileNameInput] = useState('');

  // Show all files in the dropdown, no filtering
  const selectableFiles = files;

  const generateTags = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: `Generate tags for file: ${selectedFile.name}`
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Get file content from Supabase
      const { data: fileData, error } = await supabase
        .from('files')
        .select('content')
        .eq('id', selectedFile.id)
        .single();

      if (error) throw error;

      // Extract text content from file
      let fileContent = '';
      if (fileData.content) {
        if (typeof fileData.content === 'string') {
          fileContent = fileData.content;
        } else if (typeof fileData.content === 'object' && 'blocks' in fileData.content) {
          const blocks = (fileData.content as any).blocks;
          if (Array.isArray(blocks)) {
            fileContent = blocks[0]?.content || '';
          }
        }
      }

      // Call backend API to generate tags
      const response = await fetch('http://localhost:5000/generate-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fileContent,
          filename: selectedFile.name
        }),
      });

      if (!response.ok) throw new Error('Failed to generate tags');

      const { tags } = await response.json();
      setGeneratedTags(tags);
      
      const aiResponse = `I've analyzed "${selectedFile.name}" and generated ${tags.length} relevant tags: ${tags.join(', ')}. You can apply these tags to your file or modify them as needed.`;
      
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: aiResponse
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error generating tags:', error);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error while generating tags. Please try again.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTag = async (tag: string) => {
    if (!selectedFile) return;

    try {
      // Check if tag already exists
      const { data: existingTag } = await supabase
        .from('tags')
        .select('*')
        .eq('name', tag)
        .eq('workspace_id', workspaceId)
        .single();

      let tagId;
      if (!existingTag) {
        // Create new tag
        const { data: newTag } = await supabase
          .from('tags')
          .insert({
            name: tag,
            workspace_id: workspaceId,
            color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
          })
          .select()
          .single();
        tagId = newTag?.id;
      } else {
        tagId = existingTag.id;
      }

      // Associate tag with file
      await supabase
        .from('file_tags')
        .insert({
          file_id: selectedFile.id,
          tag_id: tagId
        });
      
      console.log(`Tag "${tag}" applied to file ${selectedFile.name}`);
    } catch (error) {
      console.error('Error applying tag:', error);
    }
  };

  // Helper to generate tags for a given file
  async function generateTagsWithFile(file: File) {
    setIsGenerating(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: `Generate tags for file: ${file.name}`
    }]);
    try {
      // 1. Fetch file content from Supabase
      const { data: fileData, error } = await supabase
        .from('files')
        .select('content')
        .eq('id', file.id)
        .single();
      if (error) throw error;
      let fileContent = '';
      if (fileData.content) {
        if (typeof fileData.content === 'string') {
          fileContent = fileData.content;
        } else if (typeof fileData.content === 'object' && 'blocks' in fileData.content) {
          const blocks = (fileData.content as any).blocks;
          if (Array.isArray(blocks)) {
            fileContent = blocks[0]?.content || '';
          }
        }
      }
      // 2. Sync file to disk
      const syncRes = await fetch('http://localhost:5000/sync-file-to-disk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace: workspaceId,
          file_name: file.name,
          content: fileContent
        })
      });
      if (!syncRes.ok) throw new Error('Failed to sync file to disk');
      // 3. Call the tag generator backend
      const response = await fetch('http://localhost:5000/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace: workspaceId,
          file_name: file.name
        })
      });
      if (!response.ok) throw new Error('Failed to generate tags');
      const data = await response.json();
      const tags = data.tags || [];
      setGeneratedTags(tags);
      const aiResponse = `I've analyzed "${file.name}" and generated ${tags.length} relevant tags: ${tags.join(', ')}. You can apply these tags to your file or modify them as needed.`;
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating tags. Please try again.'
      }]);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col h-96">
      {/* File Name Input */}
      <div className="p-4 border-b">
        <Input
          value={fileNameInput}
          onChange={e => setFileNameInput(e.target.value)}
          placeholder="Enter file name (e.g. doc2.txt)"
          disabled={isGenerating}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500">
            <Tags className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Enter a file name and click generate to create tags!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Tags className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))
        )}
        {isGenerating && (
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Tags className="w-4 h-4 text-purple-600" />
            </div>
            <div className="bg-slate-100 px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Tags */}
      {generatedTags.length > 0 && (
        <div className="border-t p-4">
          <h4 className="text-sm font-semibold mb-2">Generated Tags:</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {generatedTags.map((tag, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyTag(tag)}
                className="text-xs"
              >
                <Tags className="w-3 h-3 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="border-t p-4">
        <Button 
          onClick={async () => {
            const file = files.find(f => f.name === fileNameInput.trim());
            setSelectedFile(file || null);
            if (file) {
              await generateTagsWithFile(file);
            } else {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `File "${fileNameInput}" not found in this workspace.`
              }]);
            }
          }}
          disabled={isGenerating || !fileNameInput.trim()}
          className="w-full"
        >
          {isGenerating ? 'Generating...' : 'Generate Tags'}
        </Button>
      </div>
    </div>
  );
};
