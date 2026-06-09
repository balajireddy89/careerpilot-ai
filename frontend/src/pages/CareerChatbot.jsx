import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, ChevronRight, RotateCcw } from 'lucide-react';
import ChatMarkdown from '../components/ChatMarkdown';
import { sendChatMessage, buildFallbackResponse } from '../lib/chatService';
import { loadChatMessages, saveChatMessages, clearChatMessages } from '../lib/chatStorage';
import { getProfileKey } from '../hooks/useFeatureSession';
import { recalculateReadiness } from '../mock/mockData';

function buildWelcomeMessage(profile) {
  return {
    id: 1,
    text: `Hello **${profile.name || 'there'}**! I'm your CareerPilot AI Advisor.\n\nI'm connected to your live Supabase profile — skills, resume, placement readiness, interviews, coding, aptitude, and your learning roadmap.\n\n**Focus:** ${profile.primaryPriority || profile.targetRole || 'Set in Profile'} | **Readiness:** ${recalculateReadiness(profile)}% | **Skills:** ${profile.skills?.length ?? 0}\n\nWhat would you like to know?`,
    sender: 'bot',
  };
}

export default function CareerChatbot({ profile }) {
  const chatKey = getProfileKey(profile);

  const [messages, setMessages] = useState(() => (
    loadChatMessages(chatKey) ?? [buildWelcomeMessage(profile)]
  ));
  const [inputText, setInputText] = useState(() => {
    try {
      return sessionStorage.getItem(`careerpilot_chat_input_${chatKey}`) || '';
    } catch {
      return '';
    }
  });
  const [botTyping, setBotTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    'What skills am I missing for my target role?',
    'Am I ready for placements?',
    'How can I improve my resume?',
    'How is my coding and aptitude progress?',
    'What should I study next on my roadmap?',
    'Tips for technical interview prep',
  ];

  useEffect(() => {
    saveChatMessages(chatKey, messages);
  }, [chatKey, messages]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`careerpilot_chat_input_${chatKey}`, inputText);
    } catch {
      /* ignore */
    }
  }, [chatKey, inputText]);

  const handleNewSession = () => {
    clearChatMessages(chatKey);
    setMessages([buildWelcomeMessage(profile)]);
    setInputText('');
    setBotTyping(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, botTyping]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), text: textToSend, sender: 'user' };
    const historyWithUser = [...messages, userMsg];
    setMessages(historyWithUser);
    setInputText('');
    setBotTyping(true);

    try {
      const replyText = await sendChatMessage({
        profile,
        userMessage: textToSend,
        history: messages,
      });
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: replyText, sender: 'bot' }]);
    } catch (err) {
      console.warn('OpenRouter failed, using profile-aware fallback:', err);
      const botText = buildFallbackResponse(profile, textToSend);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botText, sender: 'bot' }]);
    } finally {
      setBotTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-brand-500" /> AI Career Chatbot
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Answers powered by your live profile — skills, resume, placement score, interviews, coding, aptitude, and roadmap.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col h-[520px] glass-card overflow-hidden border border-slate-200 dark:border-slate-800/80">
          <div className="bg-slate-50 dark:bg-slate-900/60 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">CareerPilot Advisor</span>
            <span className="text-[10px] text-slate-400 font-semibold">(OpenRouter · all modules linked)</span>
            <button
              type="button"
              onClick={handleNewSession}
              disabled={botTyping}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-lg transition-all disabled:opacity-50"
              title="Start a fresh chat session"
            >
              <RotateCcw className="w-3 h-3" />
              New Session
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`${
                    msg.sender === 'user' ? 'max-w-[75%]' : 'max-w-[92%]'
                  } px-4 py-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200/40 dark:border-slate-800/50 rounded-tl-none'
                  }`}
                >
                  <ChatMarkdown content={msg.text} variant={msg.sender} />
                </div>
              </div>
            ))}

            {botTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-900/80 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200/40 dark:border-slate-800/50 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex gap-2">
            <input
              type="text"
              placeholder="Ask about skills, resume, placements, internships..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="glass-input flex-1 py-2.5 text-sm focus:ring-1"
              disabled={botTyping}
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || botTyping}
              className="p-2 bg-brand-600 text-white hover:bg-brand-500 rounded-xl transition-all disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-brand-500" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Suggested Topics</h4>
            </div>

            <div className="flex flex-col gap-2">
              {suggestions.map((sug, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(sug)}
                  className="w-full text-left p-3 bg-slate-100/50 dark:bg-slate-900/30 hover:bg-brand-500/5 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-between group transition-all"
                >
                  <span className="leading-snug pr-2">{sug}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
