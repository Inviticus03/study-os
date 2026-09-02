import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStudy } from '../context/StudyContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AICoachView: React.FC = () => {
  const { sessions, subjects, streak, goals, analytics } = useStudy();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **StudyOS AI Coach**. I have direct access to your **${sessions.length} logged study sessions**, streak status (**${streak.current} days**), and subject statistics.\n\nAsk me anything about your productivity patterns, subject distribution, optimal study windows, or tap any of the smart prompt queries below.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const presetQuestions = [
    { label: 'How productive was I this week?', query: 'How productive was I this week? Summarize my total focus time, streaks, and subject balance.' },
    { label: 'Which subject am I neglecting?', query: 'Which subject am I neglecting based on my weekly targets and study sessions?' },
    { label: 'When do I study best?', query: 'When do I study best? Analyze my focus scores and timestamps to find my peak cognitive window.' },
    { label: 'Create tomorrow\'s study plan', query: 'Create tomorrow\'s study plan based on my recent performance, upcoming subjects, and daily target.' },
    { label: 'Give me 3 things to improve', query: 'Give me 3 specific, evidence-based things I should improve based on my logged study history.' },
    { label: 'Compare this week with last week', query: 'Compare my study time and focus quality this week versus my previous average.' },
  ];

  const handleSend = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userText,
          sessions,
          subjects,
          streak,
          goals,
          analytics,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.response || 'I analyzed your study sessions. Keep up your consistent streak!',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI Coach error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: '⚠️ Unable to connect to the AI service at this moment. Here is a quick insight: You currently have a ' + streak.current + '-day streak with ' + analytics.totalHours + ' total study hours recorded. Keep your daily momentum going!',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#6366F1]/10 text-[#6366F1]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight uppercase font-mono text-neutral-900 dark:text-[#FAFAFA]">
              AI Study Coach
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-wider mt-1">
            Personalized cognitive and habit feedback grounded strictly in your logged study data.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-neutral-500 dark:text-[#A1A1AA] bg-neutral-100 dark:bg-[#18181B] px-3 py-1.5 rounded-full border border-neutral-200 dark:border-[#27272A] self-start sm:self-auto font-mono uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Analyzing {sessions.length} sessions</span>
        </div>
      </div>

      {/* Preset Prompts Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA]">
          Suggested Questions
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {presetQuestions.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSend(p.query)}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:border-[#6366F1] dark:hover:border-[#6366F1] text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-[#FAFAFA] whitespace-nowrap shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Container */}
      <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-4 sm:p-6 shadow-xl min-h-[420px] flex flex-col justify-between">
        
        {/* Messages List */}
        <div className="space-y-5 overflow-y-auto max-h-[500px] pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold'
                    : 'bg-[#6366F1] text-white'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-medium'
                    : 'bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A] text-neutral-900 dark:text-[#FAFAFA]'
                }`}
              >
                <div className="markdown-body">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3.5 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A] text-xs text-neutral-500 dark:text-[#A1A1AA] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#6366F1]" />
                <span>Synthesizing study data and crafting personalized advice...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputQuery);
          }}
          className="mt-6 pt-4 border-t border-neutral-100 dark:border-[#27272A] flex items-center gap-2.5"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask your coach anything about your study habits..."
            className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="p-3.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] shadow-lg transition-all disabled:opacity-50 disabled:shadow-none cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
