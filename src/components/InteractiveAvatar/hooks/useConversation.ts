import { useState, useCallback } from 'react';

// Types
interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system'; // Use string literals for now
  text: string;
  timestamp: string;
  isError?: boolean;
  isPartial?: boolean;
}

// Unique message ID counter
let messageCounter = 0;

const generateMessageId = () => {
  return `${Date.now()}_${++messageCounter}`;
};

export const useConversation = () => {
  const [conversation, setConversation] = useState<Message[]>([]);

  const addMessage = useCallback((text: string, sender: 'user' | 'ai' | 'system', isError = false) => {
    setConversation(prev => [...prev, {
      id: generateMessageId(),
      sender,
      text,
      timestamp: new Date().toISOString(),
      isError
    }]);
  }, []);

  const updateTranscript = useCallback((text: string) => {
    if (text) {
      setConversation(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.isPartial) {
          return [...prev.slice(0, -1), { ...lastMsg, text }];
        }
        return [...prev, {
          id: generateMessageId(),
          sender: 'user',
          text,
          timestamp: new Date().toISOString(),
          isPartial: true
        }];
      });
    }
  }, []);

  const finalizeTranscript = useCallback((text: string) => {
    if (text) {
      setConversation(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.isPartial) {
          // Replace the last partial message with a finalized one
          return [
            ...prev.slice(0, -1),
            {
              id: generateMessageId(),
              sender: 'user',
              text: text,
              timestamp: new Date().toISOString()
            }
          ];
        }
        // Otherwise, just append a new message
        return [
          ...prev,
          {
            id: generateMessageId(),
            sender: 'user',
            text: text,
            timestamp: new Date().toISOString()
          }
        ];
      });
    }
  }, []);

  const clearPartialMessages = useCallback(() => {
    setConversation(prev => prev.filter(msg => !msg.isPartial));
  }, []);

  const clearConversation = useCallback(() => {
    setConversation([]);
  }, []);

  return {
    conversation,
    addMessage,
    updateTranscript,
    finalizeTranscript,
    clearPartialMessages,
    clearConversation
  };
};
