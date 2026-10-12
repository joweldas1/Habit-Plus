// Smart Notification Service for Task Timelines, Grace Warnings, and Day-End Summaries
// Fully supports mobile Chrome, mobile Safari (iOS PWA), and desktop browsers via Service Worker & Notification API

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
};

export const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

/**
 * Sends a notification. Prioritizes ServiceWorkerRegistration.showNotification()
 * which is strictly REQUIRED by Chrome Android and iOS PWA, with desktop Notification() fallback.
 */
export const sendLocalNotification = async (title, body, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: '/' },
    tag: options.tag || `habitplus_${Date.now()}`,
    renotify: true,
    ...options,
  };

  // 1. Mobile browsers (Android Chrome, iOS PWA) strictly require Service Worker showNotification
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Service Worker notification failed, attempting desktop fallback:', swErr);
    }
  }

  // 2. Desktop browser fallback where new Notification() in window is permitted
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (e) {
    console.warn('Could not display window notification:', e);
    return false;
  }
};

/**
 * Send an immediate test notification with sound/vibration to verify mobile device compatibility
 */
export const sendTestNotification = async () => {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    return { success: false, reason: 'permission_denied' };
  }

  const sent = await sendLocalNotification(
    'HabitPlus: Notification Active! 🔔',
    'Local task reminders and grace period alerts are working on this device.',
    { tag: 'habitplus_test_alert' }
  );

  return { success: sent, reason: sent ? 'ok' : 'unsupported' };
};

// Check upcoming triggers and send alerts if needed
const triggeredAlerts = new Set();

export const checkAndTriggerNotifications = (dailyTasks, enabled) => {
  if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  dailyTasks.forEach((task) => {
    const [startH, startM] = task.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const [endH, endM] = task.endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    const graceLimit = endMinutes + 60;

    // 1. Task start reminder (at start minute)
    const startKey = `${dateKey}_${task.id}_start`;
    if (currentMinutes === startMinutes && !triggeredAlerts.has(startKey)) {
      triggeredAlerts.add(startKey);
      sendLocalNotification(
        `HabitPlus: Time for ${task.title}!`,
        `Your scheduled block "${task.title}" (${task.category}) is now active.`,
        { tag: startKey }
      );
    }

    // 2. 10 minutes before task end
    const endingSoonKey = `${dateKey}_${task.id}_ending`;
    if (currentMinutes === endMinutes - 10 && task.status !== 'done' && !triggeredAlerts.has(endingSoonKey)) {
      triggeredAlerts.add(endingSoonKey);
      sendLocalNotification(
        `HabitPlus: 10 mins remaining!`,
        `"${task.title}" finishes in 10 minutes. Get ready to wrap up.`,
        { tag: endingSoonKey }
      );
    }

    // 3. Grace period ending in 10 minutes warning
    const graceWarningKey = `${dateKey}_${task.id}_grace`;
    if (currentMinutes === graceLimit - 10 && task.status !== 'done' && !triggeredAlerts.has(graceWarningKey)) {
      triggeredAlerts.add(graceWarningKey);
      sendLocalNotification(
        `HabitPlus Warning: 10 mins to mark "${task.title}"!`,
        `1-hour grace window is closing. Mark as Done before points are lost.`,
        { tag: graceWarningKey }
      );
    }
  });
};
