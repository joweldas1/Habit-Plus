import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { sendMentorMessage } from '../../services/geminiService';
import {
  getMentorMessages,
  saveMentorMessages,
} from '../../services/storageService';
import {
  Send,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  Compass,
  Flame,
  Trash2,
  Loader2,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';

const SUGGESTIONS = {
  english: [
    'Grade my draft: "I am trying to habituating myself for morning work."',
    'Teach me 2 productivity idioms for professional speaking.',
    'How do I politely decline distractions at work in English?',
  ],
  coaching: [
    'How to prevent revenge bedtime procrastination after 10 PM?',
    'What is habit stacking and how can I attach fitness to my day?',
    'How do I maintain discipline during heavy travel days?',
  ],
  motivation: [
    'I feel demotivated and want to skip my evening block.',
    'Give me a stoic reality check on discipline vs fleeting motivation.',
    'Remind me why consistency today compounds into massive results.',
  ],
};

const MODE_DESCRIPTIONS = {
  english: 'Fluency drills, grammar correction, sentence polish & constructive scoring.',
  coaching: 'Science-backed daily system design, atomic habit loops & friction reduction.',
  motivation: 'Stoic reality checks, energy restoration & anti-procrastination fuel.',
};

export const AIMentorChat = () => {
  const { settings, t } = useApp();
  const { showToast } = useToast();
  const isNight = settings.theme === 'night';

  const [mode, setMode] = useState('english'); // 'english' | 'coaching' | 'motivation'
  const [messages, setMessages] = useState(() => {
    const saved = getMentorMessages();
    return saved.length
      ? saved
      : [
          {
            id: 'init-1',
            sender: 'mentor',
            text: `Welcome! I am your HabitPlus Mentor. Choose a mode on the left:\n• **English Practice**: Submit drafts for grading & polish\n• **Habit Coaching**: Science-backed daily systems\n• **Discipline Boost**: Stoic focus & anti-procrastination\n\nHow can I sharpen your discipline today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    saveMentorMessages(messages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const responseText = await sendMentorMessage(
        mode,
        text,
        messages,
        settings.language || 'en'
      );

      const mentorMsg = {
        id: `msg_${Date.now() + 1}`,
        sender: 'mentor',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, mentorMsg]);
    } catch (err) {
      console.error('Mentor error:', err);
      const isMissingKey = err.message?.includes('No Gemini API key');
      showToast(
        isMissingKey
          ? 'Gemini API key needed. Please test/configure keys in Settings.'
          : 'AI is temporarily unavailable. Check connection or try another key in Settings.',
        'error',
        5000
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: 'mentor',
          text: isMissingKey
            ? '⚠️ Please add your Gemini API key in **Settings > Test AI Connection** or in `.env.local` to enable mentoring.'
            : `⚠️ ${err.message || 'Could not reach Gemini service. Please verify your keys in Settings.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const resetList = [
      {
        id: 'init-1',
        sender: 'mentor',
        text: 'Chat history cleared. What habit or skill are we training next?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(resetList);
    saveMentorMessages(resetList);
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Desktop/Laptop 2-Column Layout */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch">
        {/* Left Sidebar on Tablets & PC: Mode Selector & Prompt Recommendations */}
        <div className="md:w-80 lg:w-96 space-y-4 shrink-0 flex flex-col justify-between md:overflow-y-auto md:max-h-[calc(100vh-125px)] pr-1">
          <div className="space-y-4">
            {/* Header info */}
            <div
              className={`p-4 rounded-2xl border ${
                isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-[#8B5CF6]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold tracking-tight">{t.mentorTitle}</h3>
                    <p className="text-[11px] text-zinc-400">{t.mentorSub}</p>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  title={t.clearChat}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3 Modes Cards */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                Select Coaching Domain
              </span>

              <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
                <button
                  onClick={() => setMode('english')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    mode === 'english'
                      ? 'bg-purple-950/40 border-[#8B5CF6] text-white shadow-md'
                      : isNight
                      ? 'bg-[#141418] border-[#27272A] text-zinc-400 hover:border-zinc-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-[#8B5CF6]" />
                    <span className="font-bold text-xs sm:text-sm">{t.modeEnglish}</span>
                  </div>
                  <p className="hidden md:block text-[11px] text-zinc-400 mt-1">
                    {MODE_DESCRIPTIONS.english}
                  </p>
                </button>

                <button
                  onClick={() => setMode('coaching')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    mode === 'coaching'
                      ? 'bg-sky-950/40 border-[#38BDF8] text-white shadow-md'
                      : isNight
                      ? 'bg-[#141418] border-[#27272A] text-zinc-400 hover:border-zinc-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-[#38BDF8]" />
                    <span className="font-bold text-xs sm:text-sm">{t.modeCoaching}</span>
                  </div>
                  <p className="hidden md:block text-[11px] text-zinc-400 mt-1">
                    {MODE_DESCRIPTIONS.coaching}
                  </p>
                </button>

                <button
                  onClick={() => setMode('motivation')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    mode === 'motivation'
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-md'
                      : isNight
                      ? 'bg-[#141418] border-[#27272A] text-zinc-400 hover:border-zinc-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs sm:text-sm">{t.modeMotivation}</span>
                  </div>
                  <p className="hidden md:block text-[11px] text-zinc-400 mt-1">
                    {MODE_DESCRIPTIONS.motivation}
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Prompts List (Visible on tablet/laptop) */}
            <div className="hidden md:block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Prompt Ideas
              </span>
              <div className="space-y-1.5">
                {(SUGGESTIONS[mode] || []).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      isNight
                        ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Context Lock Banner */}
          <div className="hidden md:flex items-start space-x-2 p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-purple-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
            <span>Strict context lock: AI mentor exclusively assists with habits, English & discipline.</span>
          </div>
        </div>

        {/* Right Main Chat Terminal (Fits seamlessly within 100vh layout) */}
        <div
          className={`flex-1 flex flex-col h-[calc(100vh-210px)] md:h-[calc(100vh-125px)] min-h-[440px] rounded-2xl border overflow-hidden transition-all duration-300 ${
            isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2.5 ${
                    isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-md ${
                      isUser
                        ? 'bg-[#8B5CF6] text-white'
                        : 'bg-zinc-800 text-[#38BDF8] border border-zinc-700'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#8B5CF6] text-white rounded-tr-sm shadow-md'
                        : isNight
                        ? 'bg-[#181820] border border-[#27272A] text-zinc-200 rounded-tl-sm'
                        : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    <span className="text-[10px] opacity-60 block mt-1.5 text-right font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-zinc-400 italic p-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#8B5CF6]" />
                <span>{t.thinking}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Mobile-only Prompt Carousel (hidden on md+) */}
          <div className="md:hidden px-3 py-2 border-t border-zinc-800/40 overflow-x-auto flex space-x-2 no-scrollbar">
            {(SUGGESTIONS[mode] || []).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[11px] font-medium whitespace-nowrap px-3 py-1.5 rounded-full bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`p-3.5 border-t flex items-center space-x-2.5 ${
              isNight ? 'bg-[#18181F] border-[#27272A]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.mentorPlaceholder}
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-colors ${
                isNight
                  ? 'bg-zinc-900 border border-zinc-700 text-white focus:border-[#8B5CF6]'
                  : 'bg-white border border-slate-300 text-slate-900 focus:border-[#8B5CF6]'
              }`}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white shadow-md active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
