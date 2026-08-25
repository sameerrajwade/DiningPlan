import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local (device-scheduled) reminders — no server / push infra needed.
// Three opt-in reminders: daily "tomorrow's meal", weekly recap, monthly insights.

export const NOTIF_IDS = {
  daily: 'reminder-daily',
  weekly: 'reminder-weekly',
  monthly: 'reminder-monthly',
} as const;

const CHANNEL_ID = 'reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Returns true if we may post notifications (requests if undetermined).
export async function ensurePermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleDaily(hour: number, body?: string): Promise<void> {
  await cancel(NOTIF_IDS.daily);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.daily,
    content: {
      // Logging (not planning) is the habit we need first — planning only pays
      // off once there's history. Copy nudges the user to log today's meals.
      title: 'Log today’s meals',
      body: body ?? 'What did the family eat today? Add it in about 10 seconds.',
      data: { screen: 'Home' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
}

export async function scheduleWeekly(): Promise<void> {
  await cancel(NOTIF_IDS.weekly);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.weekly,
    content: {
      title: 'Your week in meals',
      body: 'See how your home-vs-outside balance looked this week.',
      data: { screen: 'Insights', range: '7d' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 18,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
}

export async function scheduleMonthly(): Promise<void> {
  await cancel(NOTIF_IDS.monthly);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.monthly,
    content: {
      title: 'Monthly insights are ready',
      body: 'Check last month’s spending, variety, and top dishes.',
      data: { screen: 'Insights', range: 'lastMonth' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: 1,
      hour: 9,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancel(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
