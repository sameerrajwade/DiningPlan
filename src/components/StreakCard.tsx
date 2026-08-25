import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, subDays } from 'date-fns';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from './motion';

interface Props {
  streak: number;
  loggedToday: boolean;
  loggedDates: Set<string>;
  today: string; // yyyy-MM-dd
  onPress: () => void;
}

const CREAM = '#FFFFFF';
const CREAM_DIM = 'rgba(255,255,255,0.85)';
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// A warm, eye-catching logging-streak card — gradient background, big flame +
// count, and a 7-day activity strip. Tapping logs a meal.
export const StreakCard: React.FC<Props> = ({ streak, loggedToday, loggedDates, today, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Last 7 days (oldest → today) with logged state, for the activity strip.
  const week = useMemo(() => {
    const base = new Date(today + 'T00:00:00');
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(base, 6 - i);
      const key = format(d, 'yyyy-MM-dd');
      return { key, logged: loggedDates.has(key), dow: DOW[d.getDay()], isToday: key === today };
    });
  }, [loggedDates, today]);

  const title = loggedToday
    ? streak >= 2 ? `${streak} day streak!` : 'Logged today!'
    : streak >= 1 ? `${streak} day streak` : 'Start your streak';
  const sub = loggedToday
    ? streak >= 2 ? 'On fire — keep it going tomorrow.' : 'Nice — log again tomorrow to build it.'
    : streak >= 1 ? 'Log today to keep the flame alive.' : 'Log today’s meals in ~10 seconds.';

  return (
    <PressableScale onPress={onPress} accessibilityLabel="Log a meal">
      <View
        style={styles.card}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {size.w > 0 && (
          <Svg style={StyleSheet.absoluteFill} width={size.w} height={size.h}>
            <Defs>
              <LinearGradient id="streakG" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.primary} />
                <Stop offset="1" stopColor={colors.takeout} />
              </LinearGradient>
            </Defs>
            <Rect width={size.w} height={size.h} rx={BorderRadius.md} fill="url(#streakG)" />
          </Svg>
        )}

        <View style={styles.topRow}>
          <View style={styles.flameWrap}>
            <MaterialCommunityIcons name={streak > 0 ? 'fire' : 'silverware-fork-knife'} size={26} color={CREAM} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sub}>{sub}</Text>
          </View>
          {!loggedToday && (
            <View style={styles.cta}>
              <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
              <Text style={styles.ctaText}>Log</Text>
            </View>
          )}
        </View>

        <View style={styles.strip}>
          {week.map((d, i) => (
            <View key={i} style={styles.dayCol}>
              <View style={[styles.dayDot, d.logged && styles.dayDotOn, d.isToday && styles.dayDotToday]}>
                {d.logged ? (
                  <MaterialCommunityIcons name="fire" size={13} color={colors.takeout} />
                ) : (
                  <View style={styles.dayEmpty} />
                )}
              </View>
              <Text style={styles.dayLabel}>{d.dow}</Text>
            </View>
          ))}
        </View>
      </View>
    </PressableScale>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.sm,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    flameWrap: {
      width: 46,
      height: 46,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    title: { fontFamily: Fonts.display, fontSize: FontSize.xl, color: CREAM },
    sub: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: CREAM_DIM, marginTop: 1 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: CREAM,
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
    },
    ctaText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.primary },
    strip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
    dayCol: { alignItems: 'center', gap: 4 },
    dayDot: {
      width: 30,
      height: 30,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayDotOn: { backgroundColor: CREAM },
    dayDotToday: { borderWidth: 2, borderColor: CREAM },
    dayEmpty: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
    dayLabel: { fontFamily: Fonts.bodyMedium, fontSize: 10, color: CREAM_DIM },
  });

export default StreakCard;
