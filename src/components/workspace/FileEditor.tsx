
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Type, Hash, List, Code, Quote } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type File = Tables<'files'>;

interface Block {
  id: string;
  type: 'text' | 'heading' | 'list' | 'code' | 'quote';
  content: string;
}

interface FileEditorProps {
  file: File;
  onUpdate: (fileId: string, content: any) => void;
}

export const FileEditor = ({ file, onUpdate }: FileEditorProps) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (file.content && typeof file.content === 'object' && 'blocks' in file.content) {
      setBlocks((file.content as any).blocks || []);
    } else {
      // Initialize with empty content if file has no content
      setBlocks([{
        id: Date.now().toString(),
        type: 'text',
        content: ''
      }]);
    }
    setHasChanges(false);
  }, [file]);

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: ''
    };
    setBlocks(prev => [...prev, newBlock]);
    setHasChanges(true);
  };

  const updateBlock = (blockId: string, content: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, content } : block
    ));
    setHasChanges(true);
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    setHasChanges(true);
  };

  const saveChanges = () => {
    onUpdate(file.id, { blocks });
    setHasChanges(false);
  };

  const renderBlock = (block: Block) => {
    const commonProps = {
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        updateBlock(block.id, e.target.value),
      className: "w-full border-none focus:ring-0 resize-none bg-transparent",
      placeholder: getPlaceholder(block.type)
    };

    switch (block.type) {
      case 'heading':
        return (
          <Input
            {...commonProps}
            className="text-2xl font-bold border-none focus:ring-0 bg-transparent"
          />
        );
      case 'text':
        return <Textarea {...commonProps} rows={3} />;
      case 'list':
        return <Textarea {...commonProps} rows={2} />;
      case 'code':
        return (
          <Textarea
            {...commonProps}
            className="font-mono text-sm bg-slate-50 border rounded p-3"
            rows={4}
          />
        );
      case 'quote':
        return (
          <Textarea
            {...commonProps}
            className="border-l-4 border-blue-500 pl-4 italic bg-blue-50/50"
            rows={2}
          />
        );
      default:
        return <Textarea {...commonProps} rows={2} />;
    }
  };

  const getPlaceholder = (type: Block['type']) => {
    switch (type) {
      case 'heading': return 'Enter heading...';
      case 'text': return 'Start writing...';
      case 'list': return 'Enter list items...';
      case 'code': return 'Enter code...';
      case 'quote': return 'Enter quote...';
      default: return 'Enter content...';
    }
  };

  const getBlockIcon = (type: Block['type']) => {
    switch (type) {
      case 'heading': return Hash;
      case 'text': return Type;
      case 'list': return List;
      case 'code': return Code;
      case 'quote': return Quote;
      default: return Type;
    }
  };

  if (file.is_folder) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-500">
          <p>This is a folder. Select a file to edit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">{file.name}</h2>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <span className="text-sm text-orange-600">Unsaved changes</span>
            )}
            <Button onClick={saveChanges} disabled={!hasChanges}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {blocks.map((block, index) => {
            const IconComponent = getBlockIcon(block.type);
            return (
              <div key={block.id} className="group relative">
                <div className="flex items-start space-x-2">
                  <div className="flex items-center space-x-1 mt-2">
                    <IconComponent className="w-4 h-4 text-slate-400" />
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1">
                    {renderBlock(block)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Block Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => addBlock('text')}>
              <Type className="w-4 h-4 mr-1" />
              Text
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('heading')}>
              <Hash className="w-4 h-4 mr-1" />
              Heading
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('list')}>
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('code')}>
              <Code className="w-4 h-4 mr-1" />
              Code
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('quote')}>
              <Quote className="w-4 h-4 mr-1" />
              Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
