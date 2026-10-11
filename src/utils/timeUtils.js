// Time utilities for 24-hour timeline, marking windows, and validation

export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes) => {
  const m = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const hours = Math.floor(m / 60);
  const minutes = m % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

export const formatTimeRange12h = (startTime, endTime) => {
  return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
};

export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'greetingMorning';
  if (hour >= 12 && hour < 17) return 'greetingAfternoon';
  return 'greetingEvening';
};

// Check if task crosses midnight
export const crossesMidnight = (startTime, endTime) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end <= start; // End must be after start within same 24-hr day
};

// Check if two time windows overlap
export const checkOverlap = (startA, endA, startB, endB) => {
  const a1 = timeToMinutes(startA);
  const a2 = timeToMinutes(endA);
  const b1 = timeToMinutes(startB);
  const b2 = timeToMinutes(endB);
  return Math.max(a1, b1) < Math.min(a2, b2);
};

// Calculate 24-hr coverage and find gaps
export const calculateCoverage = (tasks = []) => {
  if (!tasks.length) return { coveredMinutes: 0, coveredHours: 0, percentage: 0, gaps: [{ start: '00:00', end: '24:00' }] };
  
  // Sort tasks by start time
  const sorted = [...tasks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  let coveredMinutes = 0;
  const gaps = [];
  let currentPointer = 0; // minutes from 00:00
  
  for (const t of sorted) {
    const start = timeToMinutes(t.startTime);
    const end = timeToMinutes(t.endTime);
    
    if (start > currentPointer) {
      gaps.push({
        start: minutesToTime(currentPointer),
        end: minutesToTime(start),
        minutes: start - currentPointer
      });
    }
    
    coveredMinutes += Math.max(0, end - Math.max(currentPointer, start));
    currentPointer = Math.max(currentPointer, end);
  }
  
  if (currentPointer < 1440) {
    gaps.push({
      start: minutesToTime(currentPointer),
      end: '24:00',
      minutes: 1440 - currentPointer
    });
  }
  
  const coveredHours = (coveredMinutes / 60).toFixed(1);
  const percentage = Math.min(100, Math.round((coveredMinutes / 1440) * 100));
  
  return {
    coveredMinutes,
    coveredHours,
    percentage,
    gaps
  };
};

/**
 * Determines task status relative to the current minute
 * Statuses:
 * - 'upcoming': Current time < startTime
 * - 'active': startTime <= Current time < endTime
 * - 'awaiting_done': endTime <= Current time < endTime + 60 minutes (Grace period)
 * - 'missed': Current time >= endTime + 60 minutes
 * - 'done': User marked as Done
 */
export const evaluateTaskStatus = (task, nowMinutes = null) => {
  if (task.status === 'done') return 'done';
  
  if (nowMinutes === null) {
    const now = new Date();
    nowMinutes = now.getHours() * 60 + now.getMinutes();
  }
  
  const start = timeToMinutes(task.startTime);
  const end = timeToMinutes(task.endTime);
  const graceLimit = end + 60; // 1-hour grace window
  
  if (nowMinutes < start) {
    return 'upcoming';
  } else if (nowMinutes >= start && nowMinutes < end) {
    return 'active';
  } else if (nowMinutes >= end && nowMinutes < graceLimit) {
    return 'awaiting_done';
  } else {
    return 'missed';
  }
};

/**
 * Returns remaining countdown minutes/seconds
 */
export const getRemainingTimeDisplay = (task, now) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();
  
  const start = timeToMinutes(task.startTime);
  const end = timeToMinutes(task.endTime);
  const graceLimit = end + 60;
  
  if (currentMinutes < start) {
    const diffMin = start - currentMinutes;
    return `Starts in ${diffMin}m`;
  }
  
  if (currentMinutes >= start && currentMinutes < end) {
    const diffSec = (end * 60) - (currentMinutes * 60 + currentSeconds);
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `${m}m ${String(s).padStart(2, '0')}s left`;
  }
  
  if (currentMinutes >= end && currentMinutes < graceLimit) {
    const diffSec = (graceLimit * 60) - (currentMinutes * 60 + currentSeconds);
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `Grace ends in ${m}m ${String(s).padStart(2, '0')}s`;
  }
  
  return 'Expired';
};

// Suggested Routine template as mandated by Section 8
export const SUGGESTED_ROUTINE = [
  { id: 'sugg-1', title: 'Sleep', type: 'do', category: 'Rest', startTime: '00:00', endTime: '06:00', points: 15 },
  { id: 'sugg-2', title: 'Wake up & freshen up', type: 'do', category: 'Personal', startTime: '06:00', endTime: '06:30', points: 5 },
  { id: 'sugg-3', title: 'Fitness', type: 'do', category: 'Fitness', startTime: '06:30', endTime: '07:30', points: 15 },
  { id: 'sugg-4', title: 'Breakfast & get ready', type: 'do', category: 'Personal', startTime: '07:30', endTime: '09:00', points: 5 },
  { id: 'sugg-5', title: 'Office / Work', type: 'do', category: 'Work', startTime: '09:00', endTime: '17:00', points: 25 },
  { id: 'sugg-6', title: 'Travel & rest', type: 'do', category: 'Rest', startTime: '17:00', endTime: '18:30', points: 5 },
  { id: 'sugg-7', title: 'English practice', type: 'do', category: 'English', startTime: '18:30', endTime: '19:30', points: 10 },
  { id: 'sugg-8', title: 'Dinner & family time', type: 'do', category: 'Personal', startTime: '19:30', endTime: '21:00', points: 5 },
  { id: 'sugg-9', title: 'Self study / reading', type: 'do', category: 'Growth', startTime: '21:00', endTime: '22:30', points: 10 },
  { id: 'sugg-10', title: 'Wind down & sleep', type: 'do', category: 'Rest', startTime: '22:30', endTime: '23:59', points: 5 },
];
