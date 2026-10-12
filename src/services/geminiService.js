// Robust Gemini API Service with Dual-Key Fallback, Model Discovery, and Strict Context Enforcement

const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-pro-latest',
  'gemini-2.5-flash',
];

const DEFAULT_PRIMARY = '';
const DEFAULT_SECONDARY = '';

export const getApiKeys = () => {
  // Directly access environment variables statically so Vite bakes them in during production build
  const primaryEnv =
    import.meta.env.VITE_GEMINI_KEY_PRIMARY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_GEMINI_KEY ||
    import.meta.env.VITE_GOOGLE_API_KEY ||
    import.meta.env.VITE_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    import.meta.env.GEMINI_KEY ||
    import.meta.env.GOOGLE_API_KEY ||
    '';

  const secondaryEnv =
    import.meta.env.VITE_GEMINI_KEY_SECONDARY ||
    import.meta.env.VITE_GEMINI_KEY_BACKUP ||
    '';
  
  // Also check if user set overrides in localStorage
  let stored = {};
  try {
    const raw = localStorage.getItem('habitplus_custom_keys');
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = {};
  }

  return {
    primary: stored.primary || primaryEnv || DEFAULT_PRIMARY,
    secondary: stored.secondary || secondaryEnv || DEFAULT_SECONDARY,
  };
};

export const saveCustomApiKeys = (primary, secondary) => {
  localStorage.setItem('habitplus_custom_keys', JSON.stringify({ primary, secondary }));
};

const getCachedAIConfig = () => {
  try {
    const raw = localStorage.getItem('habitplus_active_ai_config');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveCachedAIConfig = (keyType, modelName) => {
  try {
    localStorage.setItem(
      'habitplus_active_ai_config',
      JSON.stringify({ keyType, modelName, timestamp: Date.now() })
    );
  } catch {
    // ignore
  }
};

/**
 * Execute a request against Gemini generateContent REST endpoint
 */
async function callGemini(apiKey, model, systemInstruction, userPrompt, jsonMode = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (jsonMode) {
    payload.generationConfig = {
      responseMimeType: 'application/json',
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate || !candidate.content?.parts?.[0]?.text) {
    throw new Error('Empty response from model');
  }

  return candidate.content.parts[0].text;
}

/**
 * Executes a call with auto-fallback between Primary Key and Secondary Key, and candidate models.
 */
export async function executeGeminiWithFallback(systemInstruction, userPrompt, jsonMode = false) {
  const keys = getApiKeys();
  const cached = getCachedAIConfig();
  
  const keyAttempts = [];
  if (cached && keys[cached.keyType]) {
    // Try cached key and model first
    keyAttempts.push({
      keyType: cached.keyType,
      key: keys[cached.keyType],
      models: [cached.modelName, ...CANDIDATE_MODELS.filter((m) => m !== cached.modelName)],
    });
  }

  if (keys.primary && (!cached || cached.keyType !== 'primary')) {
    keyAttempts.push({
      keyType: 'primary',
      key: keys.primary,
      models: CANDIDATE_MODELS,
    });
  }

  if (keys.secondary && (!cached || cached.keyType !== 'secondary')) {
    keyAttempts.push({
      keyType: 'secondary',
      key: keys.secondary,
      models: CANDIDATE_MODELS,
    });
  }

  if (!keyAttempts.length) {
    throw new Error('No Gemini API key configured. Please configure in .env.local or Settings.');
  }

  let lastError = null;
  let attemptCount = 0;
  const MAX_TOTAL_ATTEMPTS = 10;

  for (const { keyType, key, models } of keyAttempts) {
    for (const model of models) {
      if (attemptCount >= MAX_TOTAL_ATTEMPTS) break;
      attemptCount++;
      try {
        const result = await callGemini(key, model, systemInstruction, userPrompt, jsonMode);
        saveCachedAIConfig(keyType, model);
        return { text: result, keyType, model };
      } catch (err) {
        lastError = err;
        console.warn(`Gemini fail: ${keyType} with ${model}:`, err.message);
      }
    }
  }

  throw lastError || new Error('All Gemini API connection attempts failed');
}

/**
 * Diagnostic function for Settings -> Test AI Connection button
 */
export async function testAIConnections() {
  const keys = getApiKeys();
  const results = {
    primary: { configured: !!keys.primary, status: 'untested', model: null, latency: 0, error: null },
    secondary: { configured: !!keys.secondary, status: 'untested', model: null, latency: 0, error: null },
  };

  const testKey = async (type, key) => {
    if (!key) {
      results[type] = {
        configured: false,
        status: 'not_configured',
        model: null,
        latency: 0,
        error: 'No API key provided',
      };
      return;
    }

    for (const model of CANDIDATE_MODELS) {
      const startTime = performance.now();
      try {
        await callGemini(
          key,
          model,
          'You are HabitPlus diagnostic.',
          'Respond with strictly the word "OK".'
        );
        const duration = Math.round(performance.now() - startTime);
        results[type] = {
          configured: true,
          status: 'success',
          model,
          latency: duration,
          error: null,
        };
        return;
      } catch (err) {
        results[type] = {
          configured: true,
          status: 'failed',
          model,
          latency: Math.round(performance.now() - startTime),
          error: err.message,
        };
      }
    }
  };

  await Promise.all([
    testKey('primary', keys.primary),
    testKey('secondary', keys.secondary),
  ]);

  return results;
}

/**
 * AI Mentor Chat Completion with strict context locking
 */
export async function sendMentorMessage(mode, userMessage, history = [], language = 'en') {
  let modeInstruction;

  if (mode === 'english') {
    modeInstruction = `
You are the HabitPlus English Mentor.
Your role:
1. Help the user build English fluency, professional communication, and confidence.
2. If the user provides a sentence or paragraph, grade it (e.g. Score: 8/10), pinpoint grammar/vocabulary flaws, and provide a polished natural version.
3. Suggest 1 practical vocabulary word or idiom related to productivity and growth.
4. Keep feedback constructive, concise, and structured.
`;
  } else if (mode === 'coaching') {
    modeInstruction = `
You are the HabitPlus Habit & Routine Coach.
Your role:
1. Provide actionable habit formation guidance based on behavioral psychology (Atomic Habits, habit stacking, friction reduction).
2. Help user optimize their 24-hour daily timeline and stick to their commitments.
3. Keep advice practical, actionable within 2 minutes, and empathetic yet demanding of high discipline.
`;
  } else {
    // motivation
    modeInstruction = `
You are the HabitPlus Discipline & Motivation Mentor.
Your role:
1. Provide relentless, stoic encouragement when motivation fades.
2. Emphasize that discipline outlasts fleeting motivation.
3. Deliver punchy, empowering statements to take immediate action right now.
`;
  }

  const contextLockInstruction = `
STRICT CONTEXT RESTRICTION:
You are exclusively a mentor within the HabitPlus Gamified Routine app.
You ONLY answer questions relating to habits, daily routines, discipline, personal growth, productivity, and English learning.
If the user asks about unrelated topics (such as general programming, politics, recipes, pop culture, entertainment), POLITELY DECLINE and redirect them back to their daily discipline and habit goals.

LANGUAGE INSTRUCTION:
The user's app language is "${language}".
If the user writes in Bengali/Bangla or the language setting is "bn", respond in natural Bengali (Bangla) with high clarity and encouragement.
If the user writes in English, respond in clear English.
Always format with neat markdown, bullet points, and highlight key takeaways.
`;

  const fullSystemInstruction = `${modeInstruction}\n\n${contextLockInstruction}`;

  // Build conversational context
  let conversationText = '';
  const recentHistory = history.slice(-6);
  for (const item of recentHistory) {
    conversationText += `${item.sender === 'user' ? 'User' : 'Mentor'}: ${item.text}\n`;
  }
  conversationText += `User: ${userMessage}\nMentor:`;

  const res = await executeGeminiWithFallback(fullSystemInstruction, conversationText);
  return res.text.trim();
}
