// Smart Notification Service for Task Timelines, Grace Warnings, and Day-End Summaries

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

export const sendLocalNotification = (title, body, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  try {
    const notif = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (e) {
    console.warn('Could not display notification:', e);
    return false;
  }
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
        `Your scheduled block "${task.title}" (${task.category}) is now active.`
      );
    }

    // 2. 10 minutes before task end
    const endingSoonKey = `${dateKey}_${task.id}_ending`;
    if (currentMinutes === endMinutes - 10 && task.status !== 'done' && !triggeredAlerts.has(endingSoonKey)) {
      triggeredAlerts.add(endingSoonKey);
      sendLocalNotification(
        `HabitPlus: 10 mins remaining!`,
        `"${task.title}" finishes in 10 minutes. Get ready to wrap up.`
      );
    }

    // 3. Grace period ending in 10 minutes warning
    const graceWarningKey = `${dateKey}_${task.id}_grace`;
    if (currentMinutes === graceLimit - 10 && task.status !== 'done' && !triggeredAlerts.has(graceWarningKey)) {
      triggeredAlerts.add(graceWarningKey);
      sendLocalNotification(
        `HabitPlus Warning: 10 mins to mark "${task.title}"!`,
        `1-hour grace window is closing. Mark as Done before points are lost.`
      );
    }
  });
};
