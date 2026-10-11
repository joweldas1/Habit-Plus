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

const MODE_CONFIG = {
  english: {
    title: 'English Practice',
    icon: GraduationCap,
    placeholder: 'Paste or type your English text here for grammar, polish & grading...',
    description: 'Fluency drills, grammar correction, sentence polish & constructive scoring.',
    suggestions: [
      'Grade my draft: "I am trying to habituate myself for morning work."',
      'Teach me 2 productivity idioms for professional speaking.',
      'How do I politely decline distractions at work in English?',
    ],
  },
  coaching: {
    title: 'Habit Coaching',
    icon: Compass,
    placeholder: 'Ask about habit stacking, routine planning, or daily consistency...',
    description: 'Science-backed daily system design, atomic habit loops & friction reduction.',
    suggestions: [
      'How to prevent bedtime procrastination after 10 PM?',
      'What is habit stacking and how do I attach workouts to my day?',
      'How do I maintain discipline during busy work days?',
    ],
  },
  motivation: {
    title: 'Discipline Boost',
    icon: Flame,
    placeholder: 'Feeling demotivated or procrastinating? Ask for an instant focus boost...',
    description: 'Stoic reality checks, energy restoration & anti-procrastination fuel.',
    suggestions: [
      'I feel demotivated and want to skip my evening task.',
      'Give me a stoic reality check on discipline vs fleeting motivation.',
      'Remind me why consistency today compounds into massive results.',
    ],
  },
};

/**
 * Formats AI / chat message text with rich HTML markup (no raw asterisks or markdown clutter)
 */
const FormattedMessage = ({ text, isNight, isUser }) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const textContent = isBullet ? trimmed.replace(/^[•\-*]\s+/, '') : line;

        // Parse **bold** and `code`
        const parts = [];
        const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(textContent)) !== null) {
          if (match.index > lastIndex) {
            parts.push(textContent.substring(lastIndex, match.index));
          }
          const token = match[0];
          if (token.startsWith('**') && token.endsWith('**')) {
            const inner = token.slice(2, -2);
            parts.push(
              <strong
                key={match.index}
                className={
                  isUser
                    ? 'font-bold text-white'
                    : isNight
                    ? 'font-bold text-white'
                    : 'font-bold text-slate-900'
                }
              >
                {inner}
              </strong>
            );
          } else if (token.startsWith('`') && token.endsWith('`')) {
            const inner = token.slice(1, -1);
            parts.push(
              <code
                key={match.index}
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                  isNight ? 'bg-zinc-800 text-violet-300' : 'bg-slate-200 text-violet-800'
                }`}
              >
                {inner}
              </code>
            );
          }
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < textContent.length) {
          parts.push(textContent.substring(lastIndex));
        }

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                  isUser ? 'bg-white' : 'bg-violet-500'
                }`}
              />
              <span className="flex-1">{parts.length > 0 ? parts : textContent}</span>
            </div>
          );
        }

        return <div key={lineIdx}>{parts.length > 0 ? parts : textContent}</div>;
      })}
    </div>
  );
};

export const AIMentorChat = () => {
  const { settings, t } = useApp();
  const { showToast } = useToast();
  const isNight = settings.theme === 'night';

  const [mode, setMode] = useState('english'); // 'english' | 'coaching' | 'motivation'
  const [messages, setMessages] = useState(() => {
    const saved = getMentorMessages();
    if (saved.length && saved[0].id !== 'init-1') {
      return saved;
    }
    return [
      {
        id: 'init-1',
        sender: 'mentor',
        text: `Welcome! I am your HabitPlus Mentor.\n\nChoose a coaching mode above:\n• **English Practice**: Submit drafts for grammar, vocabulary & fluency polish\n• **Habit Coaching**: Science-backed daily systems & routine stacking\n• **Discipline Boost**: Stoic anti-procrastination fuel\n\nHow can I sharpen your discipline today?`,
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

  const currentConfig = MODE_CONFIG[mode] || MODE_CONFIG.english;

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

              <div className="grid grid-cols-3 md:grid-cols-1 gap-2.5">
                {Object.entries(MODE_CONFIG).map(([key, config]) => {
                  const isSelected = mode === key;
                  const Icon = config.icon;

                  let activeClass;
                  if (isSelected) {
                    if (key === 'english') {
                      activeClass = isNight
                        ? 'bg-violet-950/40 border-violet-500 text-white ring-1 ring-violet-500/40 shadow-sm'
                        : 'bg-violet-600 border-violet-600 text-white shadow-sm';
                    } else if (key === 'coaching') {
                      activeClass = isNight
                        ? 'bg-sky-950/40 border-sky-400 text-white ring-1 ring-sky-400/40 shadow-sm'
                        : 'bg-sky-600 border-sky-600 text-white shadow-sm';
                    } else {
                      activeClass = isNight
                        ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/40 shadow-sm'
                        : 'bg-amber-600 border-amber-600 text-white shadow-sm';
                    }
                  } else {
                    activeClass = isNight
                      ? 'bg-[#141418] border-[#27272A] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs';
                  }

                  const iconColor = isSelected
                    ? 'text-white'
                    : key === 'english'
                    ? 'text-violet-500'
                    : key === 'coaching'
                    ? 'text-sky-500'
                    : 'text-amber-500';

                  const subtitleColor = isSelected
                    ? isNight ? 'text-zinc-300' : 'text-white/90'
                    : isNight ? 'text-zinc-500' : 'text-slate-500';

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 ${activeClass}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                        <span className="font-bold text-xs sm:text-sm">{config.title}</span>
                      </div>
                      <p className={`hidden md:block text-[11px] mt-1 leading-snug ${subtitleColor}`}>
                        {config.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Prompts List (Visible on tablet/laptop) */}
            <div className="hidden md:block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Prompt Ideas for {currentConfig.title}
              </span>
              <div className="space-y-1.5">
                {currentConfig.suggestions.map((prompt, i) => (
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
                    <FormattedMessage text={m.text} isNight={isNight} isUser={isUser} />
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

          {/* Quick Suggestion Chips (Visible on ALL devices right above input) */}
          <div
            className={`px-3 py-2 border-t flex items-center gap-2 overflow-x-auto no-scrollbar transition-colors ${
              isNight ? 'bg-[#16161D] border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 shrink-0 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              {currentConfig.title}:
            </span>
            {currentConfig.suggestions.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                className={`text-[11px] font-medium whitespace-nowrap px-3 py-1 rounded-full border shrink-0 transition-all active:scale-95 ${
                  isNight
                    ? 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border-zinc-700/70 hover:text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Box with Mode-Adaptive Dynamic Placeholder */}
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
              placeholder={currentConfig.placeholder}
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-colors ${
                isNight
                  ? 'bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:border-[#8B5CF6]'
                  : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#8B5CF6]'
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
