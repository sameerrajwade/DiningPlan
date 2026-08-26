import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from './motion';

interface Props {
  streak: number;
  loggedToday: boolean;
  onPress: () => void;
}

// A small logging-streak pill — flame + streak number. Compact by design (the
// old full card with a 7-day strip was noise for a daily user). Tapping logs.
export const StreakPill: React.FC<Props> = ({ streak, loggedToday, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const hasStreak = streak >= 1;
  const label = hasStreak ? `${streak}-day streak` : 'Start your streak';
  const accent = hasStreak ? colors.takeout : colors.textMuted;

  return (
    <PressableScale onPress={onPress} accessibilityLabel={hasStreak ? `${streak} day logging streak. Log a meal.` : 'Start your logging streak. Log a meal.'}>
      <View style={styles.pill}>
        <MaterialCommunityIcons name={hasStreak ? 'fire' : 'silverware-fork-knife'} size={16} color={accent} />
        <Text style={styles.label}>{label}</Text>
        {hasStreak && !loggedToday && <Text style={styles.nudge}>· log today</Text>}
        {!hasStreak && <Text style={styles.nudge}>· log today</Text>}
      </View>
    </PressableScale>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    label: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.text },
    nudge: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted },
  });

export default StreakPill;
