
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, Brain } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AIChat } from './AIChat';

interface AIAgentsProps {
  workspaceId: string;
}

export const AIAgents = ({ workspaceId }: AIAgentsProps) => {
  const [showKnowledgeAgent, setShowKnowledgeAgent] = useState(false);
  const [showChatAgent, setShowChatAgent] = useState(false);

  return (
    <>
      {/* Fixed AI Agent Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        {/* Knowledge Graph Agent */}
        <Button
          onClick={() => setShowKnowledgeAgent(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          title="Knowledge Graph Agent"
        >
          <Brain className="w-6 h-6" />
        </Button>

        {/* Chat Agent */}
        <Button
          onClick={() => setShowChatAgent(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
          title="AI Chat Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>

      {/* Knowledge Graph Agent Dialog */}
      <Dialog open={showKnowledgeAgent} onOpenChange={setShowKnowledgeAgent}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Knowledge Graph Agent</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-96">
            <div className="text-center text-slate-500">
              <Brain className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold mb-2">Knowledge Graph Coming Soon</h3>
              <p>This agent will help you discover connections between your documents and ideas.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Agent Dialog */}
      <Dialog open={showChatAgent} onOpenChange={setShowChatAgent}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>AI Chat Assistant</span>
            </DialogTitle>
          </DialogHeader>
          <AIChat workspaceId={workspaceId} />
        </DialogContent>
      </Dialog>
    </>
  );
};
