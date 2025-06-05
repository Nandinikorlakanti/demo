
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, Brain, Tags } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AIChat } from './AIChat';
import { AutoTagGenerator } from './AutoTagGenerator';

interface AIAgentsProps {
  workspaceId: string;
}

export const AIAgents = ({ workspaceId }: AIAgentsProps) => {
  const [showQAAgent, setShowQAAgent] = useState(false);
  const [showTagAgent, setShowTagAgent] = useState(false);

  return (
    <>
      {/* Fixed AI Agent Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        {/* Q&A Agent */}
        <Button
          onClick={() => setShowQAAgent(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
          title="Q&A Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        {/* Auto Tag Generator */}
        <Button
          onClick={() => setShowTagAgent(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          title="Auto Tag Generator"
        >
          <Tags className="w-6 h-6" />
        </Button>
      </div>

      {/* Q&A Agent Dialog */}
      <Dialog open={showQAAgent} onOpenChange={setShowQAAgent}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Q&A Assistant</span>
            </DialogTitle>
          </DialogHeader>
          <AIChat workspaceId={workspaceId} type="qa" />
        </DialogContent>
      </Dialog>

      {/* Auto Tag Generator Dialog */}
      <Dialog open={showTagAgent} onOpenChange={setShowTagAgent}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Tags className="w-5 h-5" />
              <span>Auto Tag Generator</span>
            </DialogTitle>
          </DialogHeader>
          <AutoTagGenerator workspaceId={workspaceId} />
        </DialogContent>
      </Dialog>
    </>
  );
};
