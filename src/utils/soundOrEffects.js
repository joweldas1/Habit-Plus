import confetti from 'canvas-confetti';

export const triggerTaskSuccessConfetti = () => {
  try {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#8B5CF6', '#38BDF8', '#10B981', '#F59E0B'],
      disableForReducedMotion: true,
    });
  } catch {
    // Canvas or reduced motion fallback
  }
};

export const triggerDayGoalMetConfetti = () => {
  try {
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#38BDF8', '#EC4899', '#10B981', '#F59E0B'],
      disableForReducedMotion: true,
    });
  } catch {
    // Canvas or reduced motion fallback
  }
};
