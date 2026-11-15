import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { MentorMessage } from '../types';
import { aiService, MentorContext } from '../services/ai';

interface MentorViewProps {
  messages: MentorMessage[];
  onSaveMessages: (msgs: MentorMessage[]) => void;
  context: MentorContext;
}

export const MentorView: React.FC<MentorViewProps> = ({ messages, onSaveMessages, context }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: MentorMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    onSaveMessages(updated);
    setInput('');
    setIsLoading(true);

    try {
      const replyText = await aiService.chatWithMentor(text, context);
      const assistantMsg: MentorMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
      };
      onSaveMessages([...updated, assistantMsg]);
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('Clear chat history with your AI Mentor?')) {
      const resetMsg: MentorMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. What is our top focus today?`,
        timestamp: new Date().toISOString(),
      };
      onSaveMessages([resetMsg]);
    }
  };

  const quickPrompts = [
    'Debrief my performance today',
    'I feel distracted. Reset my focus.',
    'What should I prioritize next?',
    'Audit my goal timeline',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto px-2 sm:px-0 pb-16">
      {/* Context Awareness Pill */}
      <div className="ios-matte-panel rounded-2xl p-3 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${context.hasApiKey ? 'bg-white animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-xs text-zinc-300 font-medium">
            AI Mentor • Active Goals: <strong className="text-white font-mono">{context.activeGoalsCount}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {context.hasApiKey ? (
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] text-white font-mono flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5 text-white" /> Gemini Live
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-mono">
              Offline Mode
            </span>
          )}
          <button
            onClick={handleClear}
            className="text-zinc-500 hover:text-white p-1 transition-colors rounded-lg hover:bg-white/5"
            title="Clear History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none flex flex-col">
        {messages.length === 0 && (
          <div className="text-center py-12 px-4 ios-matte-panel rounded-3xl my-auto">
            <Bot className="w-8 h-8 text-white mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">FocusPilot Strategic Mentor</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Ask for advice, accountability, strategic breakdown, or tactical focus guidance.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-white text-black font-medium ml-8 shadow-md'
                  : 'ios-matte-card text-zinc-200'
              }`}
            >
              {m.content}
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-zinc-400">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start items-center text-xs text-zinc-400">
            <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
            </div>
            <span className="flex items-center gap-1.5 font-medium text-xs">
              <Loader2 className="w-3 h-3 animate-spin text-white" />
              Calculating strategy...
            </span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick Prompt Pills */}
      <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-none">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 hover:text-white transition-all active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center mt-1"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your Mentor anything..."
          className="w-full pl-4 pr-12 py-3 bg-black/50 border border-white/10 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 p-2 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-20 transition-all active:scale-95 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};