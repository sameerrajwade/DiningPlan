import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from './motion';
import { useTourStore } from '../stores/useTourStore';

type TabName = 'Home' | 'Calendar' | 'Plan' | 'Insights' | 'Profile';

interface Step {
  tab: TabName;
  profileScreen?: 'ProfileMain' | 'Settings';
  icon: string;
  title: string;
  body: string;
  highlightFab?: boolean; // spotlight the Home + button for this step
}

// Friendly name of the screen behind the card — so every step is clearly
// labelled (Home & Plan hide their nav header, so the card must say where we are).
const screenLabel = (s: Step): string =>
  s.tab === 'Profile' ? (s.profileScreen === 'Settings' ? 'Settings' : 'Profile') : s.tab;

// The guided walkthrough. Each step navigates the REAL screen behind the card so
// the user sees genuine transitions; the coach card explains what they're
// looking at. (No spotlight cutout — a clean card over the softly-dimmed screen.)
const STEPS: Step[] = [
  { tab: 'Home', icon: 'home-heart', title: 'Welcome to Sofra', body: 'You’re all set up. Here’s a quick tour. Home shows your family’s meal memory and your logging streak.' },
  { tab: 'Home', icon: 'plus-circle', title: 'Log any meal', highlightFab: true, body: 'Tap the + button (bottom-right) to add a meal in seconds — home-cooked, takeout, or dine-out. Add several dishes, mark veg or non-veg, and switch between the whole family and kids’ tiffin.' },
  { tab: 'Calendar', icon: 'calendar-week', title: 'Your meal calendar', body: 'Every meal on a calendar. Tap any day to see or plan what you’re eating.' },
  { tab: 'Plan', icon: 'auto-fix', title: 'Auto-plan the week', body: 'Generate a week of dinners from dishes your family already loves — balanced across cuisines and avoiding recent repeats. Kids’ tiffins get their own plan with repeat alerts.' },
  { tab: 'Insights', icon: 'chart-bar', title: 'See your insights', body: 'Your home-vs-outside balance, spending, cuisine variety, and dishes you haven’t made in a while.' },
  { tab: 'Home', icon: 'silverware-fork-knife', title: 'Restaurant memory', body: 'Tap “Outside Meals” on Home to see each restaurant’s visits and spending over time, and remember what to order (or skip).' },
  { tab: 'Profile', profileScreen: 'Settings', icon: 'cog', title: 'Make it yours', body: 'In Settings set your budget, currency and dining-out options. Manage or switch your family from the Family tab.' },
];

export const TourOverlay: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const active = useTourStore((s) => s.active);
  const step = useTourStore((s) => s.step);
  const next = useTourStore((s) => s.next);
  const back = useTourStore((s) => s.back);
  const finish = useTourStore((s) => s.finish);

  const current = STEPS[step];

  // End the tour by landing back on Home — never strand the user on the last
  // step's screen (Settings). Used by both Skip and Done.
  const handleFinish = () => {
    navigation.navigate('Main', { screen: 'Home', params: { screen: 'HomeMain' } });
    finish();
  };

  // Gentle pulse for the + button spotlight.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || !current?.highlightFab) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, current, pulse]);

  // Drive the real screen behind the card to match the step. Rendered inside
  // MainTabs (RootStack context), so tabs are reached via the nested "Main".
  useEffect(() => {
    if (!active || !current) return;
    const t = setTimeout(() => {
      if (current.tab === 'Profile') {
        navigation.navigate('Main', { screen: 'Profile', params: { screen: current.profileScreen ?? 'ProfileMain' } });
      } else if (current.tab === 'Home') {
        navigation.navigate('Main', { screen: 'Home', params: { screen: 'HomeMain' } });
      } else {
        navigation.navigate('Main', { screen: current.tab });
      }
    }, 0);
    return () => clearTimeout(t);
  }, [active, step, current, navigation]);

  useEffect(() => {
    if (active && !current) finish();
  }, [active, current, finish]);

  if (!active || !current) return null;

  const isLast = step === STEPS.length - 1;

  return (
    <View style={styles.scrim} pointerEvents="auto">
      {/* Spotlight the real + button so a new user sees exactly where to add. */}
      {current.highlightFab && (
        <View pointerEvents="none" style={[styles.fabHint, { bottom: insets.bottom + 60 + Spacing.md, right: Spacing.md }]}>
          <View style={styles.fabCaption}>
            <Text style={styles.fabCaptionText}>Tap + to add a meal</Text>
          </View>
          <View style={styles.fabAnchor}>
            <Animated.View
              style={[
                styles.fabRing,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                },
              ]}
            />
            <View style={styles.fabMock}>
              <MaterialCommunityIcons name="plus" size={26} color={colors.white} />
            </View>
          </View>
        </View>
      )}

      <View style={[styles.cardWrap, { paddingBottom: current.highlightFab ? insets.bottom + 172 : insets.bottom + Spacing.lg }]}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name={current.icon as any} size={24} color={colors.white} />
          </View>

          <View style={styles.metaRow}>
            <View style={styles.screenChip}>
              <Text style={styles.screenChipText}>{screenLabel(current)}</Text>
            </View>
            <Text style={styles.stepCount}>Step {step + 1} of {STEPS.length}</Text>
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            <PressableScale onPress={handleFinish} accessibilityLabel="Skip tour">
              <Text style={styles.skip}>Skip</Text>
            </PressableScale>
            <View style={styles.rightActions}>
              {step > 0 && (
                <PressableScale onPress={back} style={styles.backBtn} accessibilityLabel="Previous step">
                  <Text style={styles.backText}>Back</Text>
                </PressableScale>
              )}
              <PressableScale
                onPress={isLast ? handleFinish : next}
                style={styles.nextBtn}
                accessibilityLabel={isLast ? 'Finish tour' : 'Next step'}
              >
                <Text style={styles.nextText}>{isLast ? 'Done' : 'Next'}</Text>
                {!isLast && <MaterialCommunityIcons name="arrow-right" size={16} color={colors.white} />}
              </PressableScale>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    // Soft scrim so the real screen stays visible behind the coach card.
    scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    cardWrap: { paddingHorizontal: Spacing.md },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 8,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.full,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
    screenChip: { backgroundColor: c.dineoutLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
    screenChipText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: c.primaryDark, letterSpacing: 0.3 },
    stepCount: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
    fabHint: { position: 'absolute', alignItems: 'flex-end', gap: Spacing.sm },
    fabCaption: {
      backgroundColor: c.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 6,
    },
    fabCaptionText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.text },
    fabAnchor: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
    fabRing: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: c.primary },
    fabMock: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
    },
    title: { fontFamily: Fonts.display, fontSize: FontSize.xxl, color: c.text, marginTop: 2, marginBottom: Spacing.xs },
    body: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textSecondary, lineHeight: 22 },
    dots: { flexDirection: 'row', gap: 6, marginTop: Spacing.lg, marginBottom: Spacing.md },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.border },
    dotActive: { backgroundColor: c.primary, width: 20 },
    actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rightActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    skip: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.textMuted, paddingVertical: 6, paddingHorizontal: 4 },
    backBtn: { paddingVertical: 9, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    backText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.textSecondary },
    nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 9, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, backgroundColor: c.primary },
    nextText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.md, color: c.white },
  });

export default TourOverlay;
