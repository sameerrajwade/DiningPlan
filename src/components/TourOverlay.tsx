import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from './motion';
import { useTourStore } from '../stores/useTourStore';

type TabName = 'Home' | 'Calendar' | 'Plan' | 'Insights' | 'Profile';
const TABS: TabName[] = ['Home', 'Calendar', 'Plan', 'Insights', 'Profile'];

interface Step {
  tab: TabName;
  profileScreen?: 'ProfileMain' | 'Settings';
  spotlight: 'tab' | 'fab';
  title: string;
  body: string;
}

// The guided walkthrough. Each step navigates the REAL screen behind the dim so
// the user sees genuine transitions; the spotlight ring points at where the
// feature lives (a bottom tab, or the + button on Home).
const STEPS: Step[] = [
  { tab: 'Home', spotlight: 'tab', title: 'Welcome to Sofra', body: 'You’re all set up. Here’s a quick tour. Home shows your family’s meal memory and your logging streak.' },
  { tab: 'Home', spotlight: 'fab', title: 'Log any meal', body: 'Tap + to add a meal in seconds — home-cooked, takeout, or dine-out. Add several dishes and rate them. Switch between the whole family and kids’ tiffin right here.' },
  { tab: 'Calendar', spotlight: 'tab', title: 'Your meal calendar', body: 'Every meal on a calendar. Tap any day to see or plan what you’re eating.' },
  { tab: 'Plan', spotlight: 'tab', title: 'Auto-plan the week', body: 'Generate a week of dinners from dishes your family already loves — balanced across cuisines and avoiding recent repeats. Kids’ tiffins get their own plan with repeat alerts.' },
  { tab: 'Insights', spotlight: 'tab', title: 'See your insights', body: 'Your home-vs-outside balance, spending, cuisine variety, and dishes you haven’t made in a while.' },
  { tab: 'Home', spotlight: 'tab', title: 'Restaurant memory', body: 'Tap “Outside Meals” on Home to see each restaurant’s visits and spending over time, and remember what to order (or skip).' },
  { tab: 'Profile', profileScreen: 'Settings', spotlight: 'tab', title: 'Make it yours', body: 'In Settings, set your budget, currency and dining-out options, switch household, and replay this tour anytime.' },
];

const FAB_SIZE = 56;
const PAD = 8; // spotlight padding around the target

export const TourOverlay: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const active = useTourStore((s) => s.active);
  const step = useTourStore((s) => s.step);
  const next = useTourStore((s) => s.next);
  const back = useTourStore((s) => s.back);
  const finish = useTourStore((s) => s.finish);

  const current = STEPS[step];

  // Drive the real screen behind the overlay to match the step.
  useEffect(() => {
    if (!active || !current) return;
    // Rendered inside MainTabs (RootStack context), so drive tabs via the
    // nested "Main" route.
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

  // Auto-finish if step runs past the end (defensive).
  useEffect(() => {
    if (active && !current) finish();
  }, [active, current, finish]);

  if (!active || !current) return null;

  // Tab bar geometry (react-native-bottom-tabs adds safe-area to a 60px bar).
  const tabBarH = 60 + insets.bottom;
  const tabBarTop = height - tabBarH;

  // Compute the spotlight rect from layout (no fragile element measurement).
  let hole: { x: number; y: number; w: number; h: number };
  if (current.spotlight === 'fab') {
    hole = {
      x: width - Spacing.md - FAB_SIZE,
      y: tabBarTop - Spacing.md - FAB_SIZE,
      w: FAB_SIZE,
      h: FAB_SIZE,
    };
  } else {
    const idx = TABS.indexOf(current.tab);
    const cellW = width / TABS.length;
    hole = { x: idx * cellW, y: tabBarTop, w: cellW, h: tabBarH };
  }

  const isLast = step === STEPS.length - 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim everything except the spotlight, drawn as four rects around it. */}
      <View style={[styles.dim, { left: 0, top: 0, right: 0, height: Math.max(0, hole.y - PAD) }]} />
      <View style={[styles.dim, { left: 0, top: hole.y + hole.h + PAD, right: 0, bottom: 0 }]} />
      <View style={[styles.dim, { left: 0, top: hole.y - PAD, width: Math.max(0, hole.x - PAD), height: hole.h + PAD * 2 }]} />
      <View style={[styles.dim, { left: hole.x + hole.w + PAD, top: hole.y - PAD, right: 0, height: hole.h + PAD * 2 }]} />

      {/* Spotlight ring */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: hole.x - PAD,
          top: hole.y - PAD,
          width: hole.w + PAD * 2,
          height: hole.h + PAD * 2,
          borderRadius: current.spotlight === 'fab' ? BorderRadius.full : BorderRadius.md,
          borderWidth: 2,
          borderColor: colors.primary,
        }}
      />

      {/* Coach card */}
      <View style={[styles.cardWrap, { top: height * 0.3 }]} pointerEvents="box-none">
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={colors.primary} />
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
            <PressableScale onPress={finish} accessibilityLabel="Skip tour">
              <Text style={styles.skip}>Skip</Text>
            </PressableScale>
            <View style={styles.rightActions}>
              {step > 0 && (
                <PressableScale onPress={back} style={styles.backBtn} accessibilityLabel="Previous step">
                  <Text style={styles.backText}>Back</Text>
                </PressableScale>
              )}
              <PressableScale
                onPress={isLast ? finish : next}
                style={styles.nextBtn}
                accessibilityLabel={isLast ? 'Finish tour' : 'Next step'}
              >
                <Text style={styles.nextText}>{isLast ? 'Done' : 'Next'}</Text>
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
    dim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.72)' },
    cardWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: Spacing.lg },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
    stepCount: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    title: { fontFamily: Fonts.display, fontSize: FontSize.xl, color: c.text, marginBottom: Spacing.xs },
    body: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textSecondary, lineHeight: 21 },
    dots: { flexDirection: 'row', gap: 6, marginTop: Spacing.md, marginBottom: Spacing.md },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.border },
    dotActive: { backgroundColor: c.primary, width: 18 },
    actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rightActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    skip: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.textMuted, paddingVertical: 6 },
    backBtn: { paddingVertical: 8, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    backText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.textSecondary },
    nextBtn: { paddingVertical: 8, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, backgroundColor: c.primary },
    nextText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.md, color: c.white },
  });

export default TourOverlay;
