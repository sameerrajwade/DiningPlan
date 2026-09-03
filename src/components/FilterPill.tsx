import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  // Optional leading element (a color dot, an icon, a veg mark).
  leading?: React.ReactNode;
  // Fill color when selected (defaults to the theme primary).
  selectedColor?: string;
}

// A deliberately tight pill for filter/legend rows. React Native Paper's <Chip>
// carries internal padding + a min width that even `compact` can't shrink, which
// pushes rows of 3–4 pills onto a second line on iOS (the body font is wider than
// on Android). This custom pill keeps padding minimal so those rows stay on one
// line. Multi-select GRIDS (cuisine/dish pickers) keep using Chip — they wrap by
// design.
export const FilterPill: React.FC<Props> = ({ label, selected, onPress, leading, selectedColor }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const bg = selected ? (selectedColor ?? colors.primary) : colors.surfaceVariant;
  const fg = selected ? colors.white : colors.text;
  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.pill, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
    >
      {leading}
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Wrapper>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
    },
    text: { fontSize: FontSize.xs, fontFamily: Fonts.bodyMedium },
  });

export default FilterPill;
