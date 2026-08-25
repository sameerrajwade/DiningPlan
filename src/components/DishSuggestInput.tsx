import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSelect?: (name: string) => void;
  /** Candidate dish names to suggest from (case-insensitive substring match). */
  suggestions: string[];
  placeholder?: string;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  /** A <TextInput.Icon /> element rendered on the left, matching the main dish field. */
  left?: React.ReactNode;
  style?: any;
}

// A compact dish-name field with the same as-you-type suggestions the main dish
// field (DishPicker) has — used for the "more dishes in this meal" rows and the
// restaurant "dishes ordered" rows. Suggestions render inline (in normal flow)
// rather than absolutely, so they never get clipped or hidden behind adjacent
// rows on Android.
export const DishSuggestInput: React.FC<Props> = ({
  value,
  onChangeText,
  onSelect,
  suggestions,
  placeholder,
  autoFocus,
  accessibilityLabel,
  left,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of suggestions) {
      const key = n.toLowerCase();
      if (key === q || seen.has(key)) continue;
      if (key.includes(q)) {
        seen.add(key);
        out.push(n);
        if (out.length >= 6) break;
      }
    }
    return out;
  }, [value, suggestions]);

  const show = focused && matches.length > 0;

  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        // Delay so a tap on a suggestion registers before the list hides.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        mode="outlined"
        dense
        autoFocus={autoFocus}
        style={[styles.input, style]}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        left={left as any}
      />
      {show && (
        <View style={styles.dropdown}>
          {matches.map((name) => (
            <TouchableOpacity
              key={name}
              style={styles.item}
              onPress={() => {
                onChangeText(name);
                onSelect?.(name);
                setFocused(false);
              }}
              accessibilityLabel={`Select ${name}`}
            >
              <Text style={styles.itemText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: { flex: 1 },
    input: { backgroundColor: c.surface },
    dropdown: {
      marginTop: 2,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    item: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    itemText: { fontSize: FontSize.md, fontFamily: Fonts.body, color: c.text },
  });

export default DishSuggestInput;
