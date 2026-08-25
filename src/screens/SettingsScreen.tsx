import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert, Modal } from 'react-native';
import { Text, Switch, TextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { useThemeStore, ThemeMode } from '../stores/useThemeStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { deleteUserData } from '../services/firestore';
import { deleteCurrentUser } from '../services/auth';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useTourStore } from '../stores/useTourStore';
import { PressableScale, FadeSlideIn } from '../components/motion';

const REMINDER_HOURS = [17, 18, 19, 20, 21];
const fmtHour = (h: number) => (h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`);

const THEME_MODES: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'auto', label: 'Auto', icon: 'theme-light-dark' },
  { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
];

export const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const { user, signOut } = useAuthStore();
  const { household, switchHousehold } = useHouseholdStore();
  const householdId = user?.householdId ?? null;
  const [deleting, setDeleting] = useState(false);

  // Switch which household the user is active in (by invite code). One active
  // household at a time; the user can switch back later with the other code.
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchCode, setSwitchCode] = useState('');
  const [switching, setSwitching] = useState(false);

  const handleSwitchSubmit = useCallback(async () => {
    const code = switchCode.trim();
    if (!code || !user) return;
    setSwitching(true);
    try {
      await switchHousehold(code, user.id);
      setShowSwitch(false);
      setSwitchCode('');
      Alert.alert('Household switched', 'You’re now active in the new household.');
    } catch (e: any) {
      Alert.alert('Couldn’t switch', e?.message ?? 'Check the code and try again.');
    } finally {
      setSwitching(false);
    }
  }, [switchCode, user, switchHousehold]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and profile. Your household\'s shared meals stay for other members. This can\'t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setDeleting(true);
            try {
              // Delete the Auth user FIRST — it throws 'requires-recent-login'
              // for stale sessions (the common case). If we destroyed the
              // Firestore data first, that throw would leave the account alive
              // but the profile/household membership gone (data loss).
              await deleteCurrentUser();
              await deleteUserData(user.id, householdId);
              await signOut();
            } catch (e: any) {
              if (e?.code === 'auth/requires-recent-login') {
                Alert.alert('Sign in again', 'For your security, sign out and back in, then delete your account.');
              } else {
                Alert.alert('Couldn\'t delete', 'Something went wrong. Try again.');
              }
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [user, householdId, signOut]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const notif = useNotificationStore();
  const permissionDenied = () =>
    Alert.alert(
      'Turn on notifications',
      'Allow notifications for Sofra in your phone’s settings to receive reminders.',
    );
  const onToggleDaily = useCallback(async (v: boolean) => {
    if (!(await notif.setDaily(v))) permissionDenied();
  }, [notif]);
  const onToggleWeekly = useCallback(async (v: boolean) => {
    if (!(await notif.setWeekly(v))) permissionDenied();
  }, [notif]);
  const onToggleMonthly = useCallback(async (v: boolean) => {
    if (!(await notif.setMonthly(v))) permissionDenied();
  }, [notif]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeSlideIn>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.segment}>
            {THEME_MODES.map((m) => {
              const active = mode === m.value;
              return (
                <View key={m.value} style={styles.segmentCell}>
                  <PressableScale
                    style={[styles.segmentItem, active && { backgroundColor: colors.primary }]}
                    onPress={() => setMode(m.value)}
                    accessibilityLabel={`${m.label} theme${active ? ', selected' : ''}`}
                  >
                    <MaterialCommunityIcons
                      name={m.icon as any}
                      size={18}
                      color={active ? colors.white : colors.textSecondary}
                    />
                    <Text style={[styles.segmentText, { color: active ? colors.white : colors.textSecondary }]}>
                      {m.label}
                    </Text>
                  </PressableScale>
                </View>
              );
            })}
          </View>
        </View>
      </FadeSlideIn>

      <Text style={styles.sectionLabel}>Reminders</Text>
      <View style={styles.card}>
        <View style={styles.reminderRow}>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTitle}>Daily meal reminder</Text>
            <Text style={styles.reminderSub}>Evening nudge to log today’s meals</Text>
          </View>
          <Switch value={notif.daily} onValueChange={onToggleDaily} color={colors.primary} />
        </View>
        {notif.daily && (
          <View style={styles.timeRow}>
            {REMINDER_HOURS.map((h) => {
              const active = notif.dailyHour === h;
              return (
                <PressableScale
                  key={h}
                  style={[styles.timeChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => notif.setDailyHour(h)}
                  accessibilityLabel={`Remind at ${fmtHour(h)}`}
                >
                  <Text style={[styles.timeChipText, active && { color: colors.white }]}>{fmtHour(h)}</Text>
                </PressableScale>
              );
            })}
          </View>
        )}
        <View style={styles.divider} />
        <View style={styles.reminderRow}>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTitle}>Weekly recap</Text>
            <Text style={styles.reminderSub}>Sunday evening summary</Text>
          </View>
          <Switch value={notif.weekly} onValueChange={onToggleWeekly} color={colors.primary} />
        </View>
        <View style={styles.divider} />
        <View style={styles.reminderRow}>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTitle}>Monthly insights</Text>
            <Text style={styles.reminderSub}>Recap at the start of each month</Text>
          </View>
          <Switch value={notif.monthly} onValueChange={onToggleMonthly} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Household</Text>
      <View style={styles.card}>
        <PressableScale style={styles.navRow} onPress={() => setShowSwitch(true)}>
          <MaterialCommunityIcons name="home-switch-outline" size={20} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navText}>Switch household</Text>
            {household?.name ? (
              <Text style={styles.reminderSub}>Currently in {household.name}</Text>
            ) : null}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
        </PressableScale>
        <View style={styles.divider} />
        <PressableScale style={styles.navRow} onPress={() => useTourStore.getState().start()}>
          <MaterialCommunityIcons name="gesture-tap" size={20} color={colors.textSecondary} />
          <Text style={styles.navText}>See product tour</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
        </PressableScale>
      </View>

      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.card}>
        <PressableScale style={styles.navRow} onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}>
          <MaterialCommunityIcons name="shield-lock-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.navText}>Privacy policy</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
        </PressableScale>
        <View style={styles.divider} />
        <PressableScale style={styles.navRow} onPress={() => navigation.navigate('Legal', { doc: 'terms' })}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.navText}>Terms of service</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
        </PressableScale>
        <View style={styles.divider} />
        <PressableScale style={styles.navRow} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.textSecondary} />
          <Text style={styles.navText}>Sign out</Text>
        </PressableScale>
        <View style={styles.divider} />
        <PressableScale style={styles.navRow} onPress={handleDeleteAccount}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
          <Text style={[styles.navText, { color: colors.error }]}>
            {deleting ? 'Deleting…' : 'Delete account'}
          </Text>
        </PressableScale>
      </View>

      <Text style={styles.footer}>Your family's meal memory</Text>
      <View style={{ height: Spacing.xxl }} />

      {/* Switch household — enter another household's invite code to become
          active there. One active household at a time. */}
      <Modal visible={showSwitch} transparent animationType="fade" onRequestClose={() => setShowSwitch(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Switch household</Text>
            <Text style={styles.modalBody}>
              Enter another household’s invite code to become active there. You can switch
              back anytime with your current code — you’re only ever active in one at a time.
            </Text>
            <TextInput
              value={switchCode}
              onChangeText={(t) => setSwitchCode(t.toUpperCase())}
              mode="outlined"
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="Invite code"
              style={styles.modalInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              accessibilityLabel="Household invite code"
            />
            <View style={styles.modalActions}>
              <Button
                mode="text"
                onPress={() => { setShowSwitch(false); setSwitchCode(''); }}
                textColor={colors.textSecondary}
                disabled={switching}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSwitchSubmit}
                loading={switching}
                disabled={switching || !switchCode.trim()}
                buttonColor={colors.primary}
                textColor={colors.white}
              >
                Switch
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.md },
    sectionLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.md,
    },
    segment: { flexDirection: 'row', gap: Spacing.xs },
    segmentCell: { flex: 1 },
    segmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      backgroundColor: c.surfaceVariant,
    },
    segmentText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm },
    navRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 44 },
    navText: { flex: 1, fontFamily: Fonts.body, fontSize: FontSize.md, color: c.text },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    reminderRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: Spacing.md },
    reminderInfo: { flex: 1 },
    reminderTitle: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.text },
    reminderSub: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    modalCard: { width: '100%', maxWidth: 360, backgroundColor: c.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg },
    modalTitle: { fontFamily: Fonts.display, fontSize: FontSize.xl, color: c.text, marginBottom: Spacing.sm },
    modalBody: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
    modalInput: { backgroundColor: c.surface, marginBottom: Spacing.md },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
    timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
    timeChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceVariant,
    },
    timeChipText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.text },
    footer: {
      fontFamily: Fonts.body,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: Spacing.xl,
    },
  });

export default SettingsScreen;
