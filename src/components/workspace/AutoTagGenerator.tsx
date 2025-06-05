
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Tags } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';

interface AutoTagGeneratorProps {
  workspaceId: string;
}

export const AutoTagGenerator = ({ workspaceId }: AutoTagGeneratorProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string}>>([]);

  const generateTags = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsGenerating(true);

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: userMessage
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Simulate tag generation (in real implementation, this would use AI)
      setTimeout(() => {
        const sampleTags = [
          'productivity', 'research', 'planning', 'documentation', 
          'meeting-notes', 'project', 'ideas', 'important', 
          'follow-up', 'draft', 'review', 'archive'
        ];
        
        // Generate random tags based on input
        const numTags = Math.min(5, Math.max(2, Math.floor(Math.random() * 4) + 2));
        const tags = [];
        for (let i = 0; i < numTags; i++) {
          const randomTag = sampleTags[Math.floor(Math.random() * sampleTags.length)];
          if (!tags.includes(randomTag)) {
            tags.push(randomTag);
          }
        }
        
        setGeneratedTags(tags);
        
        const aiResponse = `I've analyzed your content "${userMessage}" and generated ${tags.length} relevant tags: ${tags.join(', ')}. You can apply these tags to your files or modify them as needed.`;
        
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: aiResponse
        };
        
        setMessages(prev => [...prev, aiMsg]);
        setIsGenerating(false);
      }, 1500);

    } catch (error) {
      console.error('Error generating tags:', error);
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateTags();
    }
  };

  const applyTag = async (tag: string) => {
    try {
      // Check if tag already exists
      const { data: existingTag } = await supabase
        .from('tags')
        .select('*')
        .eq('name', tag)
        .eq('workspace_id', workspaceId)
        .single();

      if (!existingTag) {
        // Create new tag
        await supabase
          .from('tags')
          .insert({
            name: tag,
            workspace_id: workspaceId,
            color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
          });
      }
      
      console.log(`Tag "${tag}" applied to workspace`);
    } catch (error) {
      console.error('Error applying tag:', error);
    }
  };

  return (
    <div className="flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500">
            <Tags className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Describe your content to generate relevant tags!</p>
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

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your content to generate tags..."
            disabled={isGenerating}
          />
          <Button onClick={generateTags} disabled={isGenerating || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
