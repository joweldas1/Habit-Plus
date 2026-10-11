import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  GraduationCap,
  Compass,
  Flame,
  Trash2,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
const getFormattedTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const MODE_CONFIG = {
  english: {
    title: 'English Practice',
    icon: GraduationCap,
    badgeColor: 'violet',
    placeholder: 'Paste or type your English text here for grammar, polish & grading...',
    description: 'Fluency drills, grammar correction, sentence polish & constructive scoring.',
    suggestions: [
      {
        label: 'Grade my draft',
        prompt: 'Please review and grade this English writing for grammar, vocabulary and fluency: "I am trying to habituate myself for morning deep work without distractions."',
      },
      {
        label: 'Productivity idioms',
        prompt: 'Teach me 3 powerful English idioms related to focus and productivity with example sentences.',
      },
      {
        label: 'Polite workplace replies',
        prompt: 'How do I politely decline workplace interruptions and stay focused on my tasks in professional English?',
      },
    ],
  },
  coaching: {
    title: 'Habit Coaching',
    icon: Compass,
    badgeColor: 'sky',
    placeholder: 'Ask about habit stacking, routine planning, or daily consistency...',
    description: 'Science-backed daily system design, atomic habit loops & friction reduction.',
    suggestions: [
      {
        label: 'Fix bedtime routine',
        prompt: 'How do I stop revenge bedtime procrastination after 10 PM and wake up energetic at 6 AM?',
      },
      {
        label: 'Habit stacking system',
        prompt: 'What is habit stacking and how can I attach a daily workout to my existing morning routine?',
      },
      {
        label: 'Break a stubborn habit',
        prompt: 'What is the scientifically proven way to increase friction and break a stubborn bad habit?',
      },
    ],
  },
  motivation: {
    title: 'Discipline Boost',
    icon: Flame,
    badgeColor: 'amber',
    placeholder: 'Feeling demotivated or procrastinating? Ask for an instant focus boost...',
    description: 'Stoic reality checks, energy restoration & anti-procrastination fuel.',
    suggestions: [
      {
        label: 'Beat procrastination now',
        prompt: 'I feel lazy and want to skip my scheduled task right now. Give me a direct stoic reality check to start immediately.',
      },
      {
        label: '2-Minute momentum rule',
        prompt: 'Explain the 2-minute momentum rule and how it tricks the brain into taking action without friction.',
      },
      {
        label: 'Compound consistency',
        prompt: 'Remind me why doing my small routine today compounds into life-changing results in 6 months.',
      },
    ],
  },
};

const INITIAL_MESSAGES = {
  english: [
    {
      id: 'init-english',
      sender: 'mentor',
      text: `Welcome to **English Practice**! 🎓\n\nI am your AI English Coach. Submit your written drafts, daily reflections, or practice conversations here.\n\nI will review your grammar, introduce advanced vocabulary, and help you speak and write with natural confidence. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  coaching: [
    {
      id: 'init-coaching',
      sender: 'mentor',
      text: `Welcome to **Habit Coaching**! 🧭\n\nI am your Daily Routine Architect. Here we design frictionless daily systems, atomic habit loops, and routines tailored to your lifestyle.\n\nWhat habit or routine challenge would you like to solve today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  motivation: [
    {
      id: 'init-motivation',
      sender: 'mentor',
      text: `Welcome to **Discipline Boost**! 🔥\n\nI am your Stoic Accountability Partner. When procrastination strikes, resistance is high, or motivation fades, come here for immediate mental clarity.\n\nWhat is holding you back right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
};

/**
 * Formats AI / chat message text with rich HTML markup (handles headers, dividers, bold, code, bullets)
 */
const FormattedMessage = ({ text, isNight, isUser }) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Horizontal divider (---, ***, ___)
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return (
            <div
              key={lineIdx}
              className={`my-2 border-t ${
                isNight ? 'border-zinc-800' : 'border-slate-200'
              }`}
            />
          );
        }

        // Markdown Headers (###, ##, #)
        if (/^#{1,4}\s+/.test(trimmed)) {
          const headerText = trimmed.replace(/^#{1,4}\s+/, '');
          return (
            <h4
              key={lineIdx}
              className={`font-bold text-xs sm:text-sm tracking-tight pt-1.5 pb-0.5 ${
                isUser
                  ? 'text-white'
                  : isNight
                  ? 'text-violet-300'
                  : 'text-violet-700'
              }`}
            >
              {headerText}
            </h4>
          );
        }

        // Bullet list item
        const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const textContent = isBullet ? trimmed.replace(/^[•\-*]\s+/, '') : line;

        // Parse **bold**, *italic* and `code`
        const parts = [];
        const regex = /(\*\*[^\n*]+\*\*|\*[^\n*]+\*|`[^\n`]+`)/g;
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
          } else if (token.startsWith('*') && token.endsWith('*')) {
            const inner = token.slice(1, -1);
            parts.push(
              <em key={match.index} className="italic opacity-90">
                {inner}
              </em>
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

  // 3 independent conversation histories for 3 modes
  const [conversations, setConversations] = useState(() => {
    const loadModeMessages = (m) => {
      const saved = getMentorMessages(m);
      if (saved && saved.length) {
        return saved;
      }
      return INITIAL_MESSAGES[m] || [];
    };

    return {
      english: loadModeMessages('english'),
      coaching: loadModeMessages('coaching'),
      motivation: loadModeMessages('motivation'),
    };
  });

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef(null);

  // Capitalized first letter of user name for profile avatar
  const userInitial = (settings.name?.trim()?.charAt(0) || 'U').toUpperCase();

  // Active mode messages
  const activeMessages = useMemo(
    () => conversations[mode] || INITIAL_MESSAGES[mode] || [],
    [conversations, mode]
  );
  const currentConfig = MODE_CONFIG[mode] || MODE_CONFIG.english;

  // Auto-scroll inside chat box only (never scrolls ancestor main or window!)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeMessages, loading]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: generateMessageId(),
      sender: 'user',
      text,
      timestamp: getFormattedTimestamp(),
    };

    const targetMode = mode;
    const previousList = conversations[targetMode] || [];
    const updatedWithUser = [...previousList, userMsg];

    setConversations((prev) => ({
      ...prev,
      [targetMode]: updatedWithUser,
    }));
    saveMentorMessages(updatedWithUser, targetMode);

    setInputText('');
    setLoading(true);

    try {
      const responseText = await sendMentorMessage(
        targetMode,
        text,
        updatedWithUser,
        settings.language || 'en'
      );

      const mentorMsg = {
        id: generateMessageId(),
        sender: 'mentor',
        text: responseText,
        timestamp: getFormattedTimestamp(),
      };

      setConversations((prev) => {
        const nextList = [...(prev[targetMode] || []), mentorMsg];
        saveMentorMessages(nextList, targetMode);
        return {
          ...prev,
          [targetMode]: nextList,
        };
      });
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

      const errorMsg = {
        id: generateMessageId(),
        sender: 'mentor',
        text: isMissingKey
          ? '⚠️ Please add your Gemini API key in **Settings > Test AI Connection** or in `.env.local` to enable mentoring.'
          : `⚠️ ${err.message || 'Could not reach Gemini service. Please verify your keys in Settings.'}`,
        timestamp: getFormattedTimestamp(),
      };

      setConversations((prev) => {
        const nextList = [...(prev[targetMode] || []), errorMsg];
        saveMentorMessages(nextList, targetMode);
        return {
          ...prev,
          [targetMode]: nextList,
        };
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const targetMode = mode;
    const resetList = INITIAL_MESSAGES[targetMode] || [];
    setConversations((prev) => ({
      ...prev,
      [targetMode]: resetList,
    }));
    saveMentorMessages(resetList, targetMode);
    showToast(`${currentConfig.title} conversation reset.`, 'info');
  };

  return (
    <div className="h-full min-h-0 flex flex-col flex-1 animate-in fade-in duration-300">
      {/* Desktop/Laptop 2-Column Layout */}
      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:gap-4 flex-1 min-h-0 h-full items-stretch">
        {/* Left Sidebar on Tablets & PC: Mode Selector & Prompt Recommendations */}
        <div className="md:w-80 lg:w-96 space-y-2.5 sm:space-y-3 md:space-y-4 shrink-0 flex flex-col justify-between md:overflow-y-auto pr-0 md:pr-1">
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
                  title={`${t.clearChat} (${currentConfig.title})`}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3 Modes Cards - Individual Conversation Boxes */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                Select Coaching Domain
              </span>

              <div className="grid grid-cols-3 md:grid-cols-1 gap-2.5">
                {Object.entries(MODE_CONFIG).map(([key, config]) => {
                  const isSelected = mode === key;
                  const Icon = config.icon;
                  const count = (conversations[key] || []).length;

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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                          <span className="font-bold text-xs sm:text-sm">{config.title}</span>
                        </div>
                        {count > 1 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isNight
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {count}
                          </span>
                        )}
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
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Prompt Ideas for {currentConfig.title}
              </span>
              <div className="space-y-1.5">
                {currentConfig.suggestions.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(item.prompt)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all group ${
                      isNight
                        ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-violet-500/50 hover:bg-zinc-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-violet-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold group-hover:text-violet-500 transition-colors">
                        {item.label}
                      </span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-violet-500" />
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {item.prompt}
                    </p>
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
          className={`flex-1 min-h-0 flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${
            isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Header of Active Conversation */}
          <div
            className={`px-4 py-2.5 border-b flex items-center justify-between transition-colors shrink-0 ${
              isNight ? 'bg-[#16161D] border-zinc-800/80' : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <currentConfig.icon className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-bold tracking-tight">{currentConfig.title} Thread</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              {activeMessages.length} {activeMessages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>

          {/* Messages Scroll Area for this specific mode */}
          <div ref={messagesContainerRef} className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto space-y-3.5">
            {activeMessages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2.5 ${
                    isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    title={isUser ? (settings.name || 'You') : 'AI Mentor'}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-md select-none transition-all ${
                      isUser
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-extrabold ring-1 ring-white/10'
                        : 'bg-zinc-800 text-[#38BDF8] border border-zinc-700'
                    }`}
                  >
                    {isUser ? (
                      <span className="font-extrabold text-xs uppercase leading-none">
                        {userInitial}
                      </span>
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
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
          </div>

          {/* Quick Suggestion Chips Strip (Hidden scrollbar, luxury styling) */}
          <div
            className={`px-3 py-2 border-t flex items-center gap-2 overflow-x-auto no-scrollbar transition-colors ${
              isNight ? 'bg-[#141418] border-zinc-800/80' : 'bg-slate-50/90 border-slate-200/90'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0 flex items-center gap-1 pl-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="hidden sm:inline">Suggestions:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
              {currentConfig.suggestions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(item.prompt)}
                  title={item.prompt}
                  className={`text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-full border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isNight
                      ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700/70 hover:border-zinc-600'
                      : 'bg-white hover:bg-violet-50/80 text-slate-700 hover:text-violet-700 border-slate-200/90 hover:border-violet-200 shadow-xs'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isNight ? 'bg-violet-400' : 'bg-violet-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
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
