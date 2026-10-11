// AI-Powered & Deterministic Point Distribution Service (Guarantees exactly 100 total marks)
import { timeToMinutes } from '../utils/timeUtils';
import { executeGeminiWithFallback } from './geminiService';

const CATEGORY_WEIGHTS = {
  English: 1.5,
  Fitness: 1.4,
  Work: 1.5,
  Growth: 1.4,
  Personal: 0.9,
  Rest: 0.7,
  Custom: 1.0,
};

const UNPRODUCTIVE_KEYWORDS = ['game', 'gaming', 'scroll', 'social media', 'tiktok', 'reels', 'tv', 'movie', 'idle', 'play'];

/**
 * Largest Remainder Method (Hare-Niemeyer) to ensure exact integer sum
 */
export function distributePointsDeterministic(tasksToAllocate, targetPool) {
  if (!tasksToAllocate.length || targetPool <= 0) return {};
  if (tasksToAllocate.length === 1) {
    return { [tasksToAllocate[0].id]: targetPool };
  }

  // Calculate weighted scores
  const weighted = tasksToAllocate.map((task) => {
    const duration = Math.max(15, timeToMinutes(task.endTime) - timeToMinutes(task.startTime));
    const catWeight = CATEGORY_WEIGHTS[task.category] || 1.0;
    
    // Check if habit is leisure / counterproductive
    const titleLower = (task.title || '').toLowerCase();
    const isLeisure = UNPRODUCTIVE_KEYWORDS.some((kw) => titleLower.includes(kw));

    let disciplineMultiplier = 1.0;
    if (task.type === 'avoid') {
      disciplineMultiplier = 1.3; // High reward for avoiding bad habits
    } else if (isLeisure) {
      disciplineMultiplier = 0.15; // Heavily penalize unproductive habits
    }

    const weight = duration * catWeight * disciplineMultiplier;
    return { id: task.id, weight };
  });

  const totalWeight = Math.max(1, weighted.reduce((acc, curr) => acc + curr.weight, 0));

  // Exact quotas
  let allocations = {};
  let remainders = [];
  let allocatedTotal = 0;

  weighted.forEach((item) => {
    const rawPoints = (item.weight / totalWeight) * targetPool;
    const floorPoints = Math.max(1, Math.floor(rawPoints)); // At least 1 point per task
    allocations[item.id] = floorPoints;
    allocatedTotal += floorPoints;
    remainders.push({ id: item.id, remainder: rawPoints - floorPoints });
  });

  // Distribute remaining points based on largest remainder
  let diff = targetPool - allocatedTotal;
  if (diff > 0) {
    remainders.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < diff; i++) {
      const idx = i % remainders.length;
      allocations[remainders[idx].id] += 1;
    }
  } else if (diff < 0) {
    const sorted = [...weighted].sort((a, b) => b.weight - a.weight);
    let neededReductions = Math.abs(diff);
    for (let i = 0; i < sorted.length && neededReductions > 0; i++) {
      if (allocations[sorted[i].id] > 1) {
        allocations[sorted[i].id] -= 1;
        neededReductions--;
      }
    }
  }

  return allocations;
}

/**
 * Distribute points across all tasks or remaining uncompleted pool (Total strictly 100)
 */
export async function calculateDynamicPoints(allTasks, lockedTasks = []) {
  if (!allTasks || !allTasks.length) return { tasks: [], fallbackUsed: false };

  // Identify locked points (e.g. Done or Missed tasks today)
  const lockedIds = new Set(lockedTasks.map((t) => t.id));
  let lockedSum = 0;
  lockedTasks.forEach((t) => {
    lockedSum += t.points || 0;
  });

  const tasksToAllocate = allTasks.filter((t) => !lockedIds.has(t.id));
  const remainingPool = Math.max(0, 100 - lockedSum);

  if (tasksToAllocate.length === 0) {
    return { tasks: allTasks, fallbackUsed: false };
  }

  let finalAllocations = null;
  let fallbackUsed = false;

  // Try AI distribution first
  try {
    const systemPrompt = `You are the HabitPlus AI Points Arbiter.
Your goal: allocate whole number points across a user's daily habits such that the sum of points equals EXACTLY ${remainingPool}.
Evaluate each habit by:
1. Title & Value:
   - High-discipline productive blocks (Deep Work, English drills, Intensive Fitness, Growth) MUST receive high points (e.g. 15-25 points).
   - Healthy physiological blocks (Sleep at night, meals, wind-down) receive balanced points (e.g. 5-10 points).
   - Unproductive leisure habits (such as playing video games late at night, scrolling social media, mindless screen time) MUST be penalized with minimal points (1 to 2 points max).
2. Category & Duration.
Return STRICTLY valid JSON with no markdown wrapping or text:
{"allocations": {"taskId": integerPoints, ...}}
The sum of all allocated points MUST equal EXACTLY ${remainingPool}. Every task must have at least 1 point.`;

    const userPrompt = JSON.stringify({
      targetPool: remainingPool,
      tasks: tasksToAllocate.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        category: t.category,
        startTime: t.startTime,
        endTime: t.endTime,
        durationMinutes: timeToMinutes(t.endTime) - timeToMinutes(t.startTime),
      })),
    });

    const aiResult = await executeGeminiWithFallback(systemPrompt, userPrompt, true);
    let parsedText = aiResult.text.trim();
    parsedText = parsedText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(parsedText);

    if (parsed && parsed.allocations) {
      let sum = 0;
      let valid = true;
      for (const t of tasksToAllocate) {
        const pts = parseInt(parsed.allocations[t.id], 10);
        if (isNaN(pts) || pts <= 0) {
          valid = false;
          break;
        }
        sum += pts;
      }

      if (valid && sum === remainingPool) {
        finalAllocations = parsed.allocations;
      }
    }
  } catch (err) {
    console.warn('AI point distribution failed, falling back to deterministic:', err);
    fallbackUsed = true;
  }

  if (!finalAllocations) {
    fallbackUsed = true;
    finalAllocations = distributePointsDeterministic(tasksToAllocate, remainingPool);
  }

  // Merge back into all tasks
  const updatedTasks = allTasks.map((t) => {
    if (lockedIds.has(t.id)) {
      return t;
    }
    const pts = finalAllocations[t.id] || 1;
    return { ...t, points: pts };
  });

  return {
    tasks: updatedTasks,
    fallbackUsed,
  };
}
