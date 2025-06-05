
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'ai_conversations'>;
type Message = Tables<'ai_messages'>;

interface AIChatProps {
  workspaceId: string;
}

export const AIChat = ({ workspaceId }: AIChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    initializeConversation();
  }, [workspaceId]);

  const initializeConversation = async () => {
    if (!user) return;

    try {
      // Try to find existing conversation
      const { data: existingConversations } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (existingConversations && existingConversations.length > 0) {
        const conv = existingConversations[0];
        setConversation(conv);
        loadMessages(conv.id);
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from('ai_conversations')
          .insert({
            workspace_id: workspaceId,
            user_id: user.id,
            title: 'AI Assistant Chat'
          })
          .select()
          .single();

        if (error) throw error;
        setConversation(newConversation);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation || !user) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message
      const { data: userMsg, error: userError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: userMessage
        })
        .select()
        .single();

      if (userError) throw userError;

      setMessages(prev => [...prev, userMsg]);

      // Simulate AI response (replace with actual AI integration)
      setTimeout(async () => {
        const aiResponse = `I understand you're asking about "${userMessage}". As an AI assistant, I'm here to help you with your workspace tasks. This is a demo response - in a real implementation, this would connect to an AI service like OpenAI.`;

        const { data: aiMsg, error: aiError } = await supabase
          .from('ai_messages')
          .insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: aiResponse
          })
          .select()
          .single();

        if (aiError) throw aiError;

        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500">
            <Bot className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Start a conversation with your AI assistant!</p>
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
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
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
        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
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

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
