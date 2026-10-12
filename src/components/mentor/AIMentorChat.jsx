import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  sendMentorMessage,
  generateContextualSuggestions,
} from '../../services/geminiService';
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
  RotateCw,
  X,
} from 'lucide-react';

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
const getFormattedTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const SUGGESTION_POOLS = {
  english: [
    { label: 'Grade my draft', prompt: 'Please review and grade this English writing for grammar, vocabulary and fluency: "I am trying to habituate myself for morning deep work without distractions."' },
    { label: 'Productivity idioms', prompt: 'Teach me 3 powerful English idioms related to focus and productivity with realistic example sentences.' },
    { label: 'Polite workplace replies', prompt: 'How do I politely decline workplace interruptions and stay focused on my tasks in professional English?' },
    { label: 'Subjunctive mood', prompt: 'Explain how and when to use the English subjunctive mood in professional emails with realistic examples.' },
    { label: 'Affect vs Effect', prompt: 'Explain the nuanced differences and edge cases between "affect", "effect", and their rare noun/verb forms.' },
    { label: 'Eliminate filler words', prompt: 'Give me practical techniques to stop using filler words ("um", "like", "basically") during English conversations.' },
    { label: 'Executive C-level idioms', prompt: 'Teach me 3 high-impact idioms frequently used by leaders and executives in top strategy meetings.' },
    { label: 'Diplomatic pushback', prompt: 'How do I push back against unrealistic deadlines professionally and diplomatically in English?' },
    { label: 'Natural speaking flow', prompt: 'How can I connect my thoughts smoothly in spoken English without pausing awkwardly?' },
    { label: 'Avoid passive voice', prompt: 'How do I identify and transform weak passive sentences into punchy, persuasive active voice?' },
    { label: 'Synonym nuances', prompt: 'What is the subtle difference in meaning and tone between "pragmatic", "feasible", and "viable"?' },
    { label: 'Elevate daily email', prompt: 'Here is a routine work update email. Show me how to rewrite it with senior-level professional polish.' },
  ],
  coaching: [
    { label: 'Fix bedtime routine', prompt: 'How do I stop revenge bedtime procrastination after 10 PM and wake up energetic at 6 AM?' },
    { label: 'Habit stacking system', prompt: 'What is habit stacking and how can I attach a daily workout or reading to my existing anchor routine?' },
    { label: 'Break a stubborn habit', prompt: 'What is the scientifically proven way to increase friction and break a stubborn bad habit?' },
    { label: '2-Minute momentum rule', prompt: 'Explain the 2-minute entry barrier rule and how it tricks the brain into starting hard tasks.' },
    { label: 'Dopamine detox protocol', prompt: 'Give me a realistic 24-hour dopamine reset protocol that genuinely reduces phone scrolling addiction.' },
    { label: 'Circadian sunlight sync', prompt: 'How does getting sunlight within 30 minutes of waking reset cortisol and evening melatonin release?' },
    { label: 'Never miss twice rule', prompt: 'How do I apply James Clear\'s "Never Miss Twice" rule to avoid the guilt spiral after slipping?' },
    { label: 'Environment redesign', prompt: 'Give me an actionable checklist to redesign my room so positive habits are effortless and temptations invisible.' },
    { label: 'Overcome day 3 drop-off', prompt: 'Why does human motivation drop sharply on day 3 or 4 of a new routine, and how do I push through?' },
    { label: 'Time-boxing deep work', prompt: 'How do I set up a time-boxing schedule that protects my 2 hours of peak cognitive focus before noon?' },
    { label: 'Non-Sleep Deep Rest (NSDR)', prompt: 'What is NSDR (Non-Sleep Deep Rest) and how can a 10-minute session restore mental energy mid-day?' },
    { label: 'Friction audit formula', prompt: 'Help me conduct a 5-minute friction audit on my morning routine to eliminate wasted decision fatigue.' },
  ],
  motivation: [
    { label: 'Kill resistance now', prompt: 'I feel lazy and want to skip my scheduled task right now. Give me a direct stoic reality check to start immediately.' },
    { label: '2-Minute momentum rule', prompt: 'Explain how starting for just 120 seconds breaks psychological inertia and triggers task completion.' },
    { label: 'Compound consistency', prompt: 'Remind me why doing my small routine today compounds into life-changing results in 6 months.' },
    { label: 'Mel Robbins 5-sec rule', prompt: 'Explain the neuroscience behind the 5-second countdown rule and how it stops hesitation.' },
    { label: 'Marcus Aurelius advice', prompt: 'What did Roman Emperor Marcus Aurelius tell himself when he felt unmotivated to get out of bed?' },
    { label: 'Dichotomy of control', prompt: 'How can I apply Epictetus\'s dichotomy of control to stop stressing over things outside my power?' },
    { label: 'Task paralysis triage', prompt: 'I am overwhelmed and freezing up. Give me a 3-step triage to execute right this second.' },
    { label: 'Discipline vs Motivation', prompt: 'Why is waiting for motivation an illusion, and how do high performers build identity-driven discipline?' },
    { label: '1% Better every day math', prompt: 'Break down the math and psychological proof behind getting 1% better every day for a year.' },
    { label: 'Amor Fati mindset', prompt: 'How do I cultivate the Stoic concept of "Amor Fati" (love of one\'s fate) when work feels exhausting?' },
    { label: 'Jocko Willink discipline', prompt: 'Explain Jocko Willink\'s philosophy "Discipline equals Freedom" in the context of daily habits.' },
    { label: 'Overcoming mental fatigue', prompt: 'Is mental exhaustion real or perceived? How do I distinguish between needing rest vs needing discipline?' },
  ],
};

export const getRandomSuggestions = (modeKey, exclude = [], count = 3) => {
  const pool = SUGGESTION_POOLS[modeKey] || SUGGESTION_POOLS.english;
  const filtered = pool.filter((item) => !exclude.some((ex) => ex.prompt === item.prompt));
  const candidatePool = filtered.length >= count ? filtered : pool;
  const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const MODE_CONFIG = {
  english: {
    title: 'English Practice',
    icon: GraduationCap,
    badgeColor: 'violet',
    placeholder: 'Paste or type your English text here for grammar, polish & grading...',
    description: 'Fluency drills, grammar correction, sentence polish & constructive scoring.',
  },
  coaching: {
    title: 'Habit Coaching',
    icon: Compass,
    badgeColor: 'sky',
    placeholder: 'Ask about habit stacking, routine planning, or daily consistency...',
    description: 'Science-backed daily system design, atomic habit loops & friction reduction.',
  },
  motivation: {
    title: 'Discipline Boost',
    icon: Flame,
    badgeColor: 'amber',
    placeholder: 'Feeling demotivated or procrastinating? Ask for an instant focus boost...',
    description: 'Stoic reality checks, energy restoration & anti-procrastination fuel.',
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

  // Toggleable and dynamic suggestion engine
  const [showSuggestions, setShowSuggestions] = useState(() => {
    try {
      return localStorage.getItem('habitplus_show_suggestions') !== 'false';
    } catch {
      return true;
    }
  });

  const [modeSuggestions, setModeSuggestions] = useState(() => ({
    english: getRandomSuggestions('english'),
    coaching: getRandomSuggestions('coaching'),
    motivation: getRandomSuggestions('motivation'),
  }));

  const [isRotating, setIsRotating] = useState(false);

  const toggleSuggestions = useCallback(() => {
    setShowSuggestions((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('habitplus_show_suggestions', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleShuffleSuggestions = useCallback(() => {
    setIsRotating(true);
    setModeSuggestions((prev) => ({
      ...prev,
      [mode]: getRandomSuggestions(mode, prev[mode] || []),
    }));
    setTimeout(() => setIsRotating(false), 500);
  }, [mode]);

  // Rotate suggestions every time mode changes or component is entered
  useEffect(() => {
    setModeSuggestions((prev) => ({
      ...prev,
      [mode]: getRandomSuggestions(mode, prev[mode] || []),
    }));
  }, [mode]);

  // Context-aware AI suggestions: track topic and generate unexplored angles
  useEffect(() => {
    const currentMsgs = conversations[mode] || [];
    const hasUserMsg = currentMsgs.some((m) => m.sender === 'user');
    if (!hasUserMsg) return;

    let isMounted = true;
    generateContextualSuggestions(mode, currentMsgs, settings.language || 'en')
      .then((aiSuggestions) => {
        if (isMounted && aiSuggestions && aiSuggestions.length > 0) {
          setModeSuggestions((prev) => ({
            ...prev,
            [mode]: aiSuggestions,
          }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [conversations, mode, settings.language]);

  // Active mode messages
  const activeMessages = useMemo(
    () => conversations[mode] || INITIAL_MESSAGES[mode] || [],
    [conversations, mode]
  );
  const currentConfig = MODE_CONFIG[mode] || MODE_CONFIG.english;
  const currentSuggestions = modeSuggestions[mode] || getRandomSuggestions(mode);

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
      showToast(
        settings.language === 'bn'
          ? 'AI এই মুহূর্তে ব্যস্ত। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।'
          : 'AI is momentarily busy. Please try again in a few moments.',
        'error',
        4000
      );

      const errorMsg = {
        id: generateMessageId(),
        sender: 'mentor',
        text: settings.language === 'bn'
          ? '⚠️ AI সেবাটির সাথে সংযোগ করতে সমস্যা হচ্ছে। অনুগ্রহ করে একটু পর আবার আপনার প্রশ্নটি পাঠান।'
          : '⚠️ AI service is momentarily unreachable. Please try sending your message again in a moment.',
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
    <div className="flex-1 min-h-0 flex flex-col animate-in fade-in duration-300">
      {/* Desktop/Laptop 2-Column Layout */}
      <div className="flex flex-col md:flex-row gap-1.5 sm:gap-3 md:gap-4 flex-1 min-h-0">
        {/* Left Sidebar on Tablets & PC: Mode Selector & Prompt Recommendations */}
        <div className="md:w-72 lg:w-80 space-y-2 sm:space-y-3 shrink-0 flex flex-col md:overflow-y-auto pr-0 md:pr-1">
          {/* Header info (Desktop only to maximize mobile chat height) */}
          <div
            className={`hidden md:block p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
              isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-purple-500/20 text-[#8B5CF6]">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-bold tracking-tight">{t.mentorTitle}</h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400">{t.mentorSub}</p>
                </div>
              </div>

              <button
                onClick={handleClear}
                title={`${t.clearChat} (${currentConfig.title})`}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* 3 Modes Cards - Individual Conversation Boxes */}
          <div className="space-y-1 sm:space-y-1.5">
            <span className="hidden md:block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
              Select Coaching Domain
            </span>

            <div className="grid grid-cols-3 md:grid-cols-1 gap-1 sm:gap-2">
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
                      className={`p-1.5 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl border text-left transition-all duration-200 ${activeClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${iconColor}`} />
                          <span className="font-bold text-[10.5px] sm:text-xs md:text-sm truncate">{config.title}</span>
                        </div>
                        {count > 1 && (
                          <span
                            className={`text-[8.5px] sm:text-[10px] px-1 py-0.2 rounded-full font-mono shrink-0 ml-1 ${
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
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  Prompt Ideas ({currentConfig.title})
                </span>
                <button
                  type="button"
                  onClick={handleShuffleSuggestions}
                  title="Shuffle suggestions"
                  className="p-1 rounded text-zinc-400 hover:text-violet-400 transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="space-y-1.5">
                {currentSuggestions.map((item, i) => (
                  <button
                    key={`${item.label}-${i}`}
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

          {/* Context Lock Banner (High contrast in day mode, sleek in night mode) */}
          <div
            className={`hidden md:flex items-start space-x-2 p-2.5 rounded-xl border text-[11px] leading-relaxed ${
              isNight
                ? 'bg-purple-950/25 border-purple-500/20 text-purple-300'
                : 'bg-purple-50 border-purple-200 text-purple-900 font-medium'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
            <span>Strict context lock: AI mentor exclusively assists with habits, English & discipline.</span>
          </div>
        </div>

        {/* Right Main Chat Terminal (Fits seamlessly within 100vh layout) */}
        <div
          className={`flex-1 min-h-0 flex flex-col rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-300 ${
            isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Header of Active Conversation */}
          <div
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 border-b flex items-center justify-between transition-colors shrink-0 ${
              isNight ? 'bg-[#16161D] border-zinc-800/80' : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <currentConfig.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
              <span className="text-[11px] sm:text-xs font-bold tracking-tight">{currentConfig.title} Thread</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                type="button"
                onClick={toggleSuggestions}
                title={showSuggestions ? 'Hide suggestion bar' : 'Show suggestion bar'}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                  showSuggestions
                    ? 'text-violet-400 bg-violet-500/15 border border-violet-500/30'
                    : isNight
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline text-[10px]">
                  {showSuggestions ? 'Suggestions' : 'Show Prompts'}
                </span>
              </button>

              <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                {activeMessages.length} {activeMessages.length === 1 ? 'msg' : 'messages'}
              </span>
              <button
                type="button"
                onClick={handleClear}
                title={`${t.clearChat} (${currentConfig.title})`}
                className="p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area for this specific mode */}
          <div ref={messagesContainerRef} className="flex-1 min-h-0 p-2 sm:p-3.5 overflow-y-auto space-y-2 sm:space-y-3">
            {activeMessages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-1.5 sm:space-x-2.5 ${
                    isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    title={isUser ? (settings.name || 'You') : 'AI Mentor'}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 text-xs shadow-md select-none transition-all ${
                      isUser
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-extrabold ring-1 ring-white/10'
                        : 'bg-zinc-800 text-[#38BDF8] border border-zinc-700'
                    }`}
                  >
                    {isUser ? (
                      <span className="font-extrabold text-[10px] sm:text-xs uppercase leading-none">
                        {userInitial}
                      </span>
                    ) : (
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>

                  {/* Message bubble with timestamp placed outside underneath */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[80%] md:max-w-[75%]`}>
                    <div
                      className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#8B5CF6] text-white rounded-tr-xs shadow-md'
                          : isNight
                          ? 'bg-[#181820] border border-[#27272A] text-zinc-200 rounded-tl-xs'
                          : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      <FormattedMessage text={m.text} isNight={isNight} isUser={isUser} />
                    </div>
                    <span
                      className={`text-[9.5px] sm:text-[10px] font-mono mt-0.5 px-1 ${
                        isNight ? 'text-zinc-500' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-zinc-400 italic p-1.5 sm:p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B5CF6]" />
                <span>{t.thinking}</span>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips Strip (Collapsible, Dynamic & Curiosity-Driven) */}
          {showSuggestions && (
            <div
              className={`px-2 py-1 sm:px-3 sm:py-1.5 border-t flex items-center justify-between gap-1.5 transition-all duration-200 shrink-0 ${
                isNight ? 'bg-[#141418] border-zinc-800/80' : 'bg-slate-50/90 border-slate-200/90'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0 flex items-center gap-1 pl-0.5">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-violet-400" />
                  <span className="hidden sm:inline">Explore:</span>
                </span>

                <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0">
                  {currentSuggestions.map((item, i) => (
                    <button
                      key={`${item.label}-${i}`}
                      type="button"
                      onClick={() => handleSend(item.prompt)}
                      title={item.prompt}
                      className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs ${
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

              {/* Action Buttons: Shuffle and Hide */}
              <div className="flex items-center space-x-1 shrink-0 pl-1 border-l border-zinc-700/40">
                <button
                  type="button"
                  onClick={handleShuffleSuggestions}
                  title="Shuffle suggestions"
                  className="p-1 rounded-md text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                >
                  <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={toggleSuggestions}
                  title="Hide suggestions"
                  className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Message Input Box with Mode-Adaptive Dynamic Placeholder */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`shrink-0 p-1.5 sm:p-2.5 md:p-3 border-t flex items-center space-x-1.5 sm:space-x-2.5 ${
              isNight ? 'bg-[#18181F] border-[#27272A]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            {!showSuggestions && (
              <button
                type="button"
                onClick={toggleSuggestions}
                title="Show exploration suggestions"
                className={`p-1.5 sm:p-2 rounded-lg text-violet-400 hover:bg-violet-500/15 border border-violet-500/20 transition-all shrink-0 flex items-center gap-1 ${
                  isNight ? 'bg-zinc-900' : 'bg-white shadow-2xs'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">Prompts</span>
              </button>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={currentConfig.placeholder}
              disabled={loading}
              className={`flex-1 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none transition-colors ${
                isNight
                  ? 'bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:border-[#8B5CF6]'
                  : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#8B5CF6]'
              }`}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-1.5 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white shadow-md active:scale-95 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
