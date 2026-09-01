import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { PressableScale } from './motion';
import type { CookAgainDish, Suggestion } from '../utils/quickActions';

// One cohesive "Quick add" card — the fast paths to logging tonight without the
// full + form: re-log a recent dish, let Sofra decide, or record leftovers. It
// never blocks the + flow; it's a shortcut, so the visual weight stays light.
interface Props {
  colors: ThemeColors;
  cookAgain: CookAgainDish[];
  suggestion: Suggestion | null;
  busy: boolean;
  onDecide: () => void;
  onShuffle: () => void;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
  onCookAgain: (dish: CookAgainDish) => void;
  onLeftovers: () => void;
}

export const QuickActions: React.FC<Props> = ({
  colors,
  cookAgain,
  suggestion,
  busy,
  onDecide,
  onShuffle,
  onAcceptSuggestion,
  onDismissSuggestion,
  onCookAgain,
  onLeftovers,
}) => {
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View>
      <Text style={styles.sectionTitle}>Quick add</Text>
      <View style={styles.card}>
        {suggestion ? (
          // "Decide for me" result — takes over the card until dismissed/logged.
          <View>
            <Text style={styles.suggestLabel}>Tonight, try</Text>
            <Text style={styles.suggestName} numberOfLines={1}>{suggestion.name}</Text>
            <Text style={styles.suggestMeta}>
              {suggestion.isNew
                ? 'Something new to try'
                : suggestion.lastMadeDaysAgo != null
                  ? `Last made ${suggestion.lastMadeDaysAgo} ${suggestion.lastMadeDaysAgo === 1 ? 'day' : 'days'} ago`
                  : ''}
            </Text>
            <View style={styles.suggestActions}>
              <PressableScale onPress={onAcceptSuggestion} disabled={busy} style={styles.grow}>
                <View style={[styles.primaryBtn, { backgroundColor: colors.home }]}>
                  <MaterialCommunityIcons name="pot-steam" size={16} color={colors.white} />
                  <Text style={[styles.primaryBtnText, { color: colors.white }]}>Cook this</Text>
                </View>
              </PressableScale>
              <TouchableOpacity onPress={onShuffle} disabled={busy} style={styles.ghostBtn} accessibilityLabel="Try another">
                <MaterialCommunityIcons name="refresh" size={18} color={colors.textSecondary} />
                <Text style={styles.ghostBtnText}>Shuffle</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDismissSuggestion} disabled={busy} style={styles.iconBtn} accessibilityLabel="Dismiss">
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {cookAgain.length > 0 && (
              <>
                <Text style={styles.rowLabel}>Cook again</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipScroll}
                >
                  {cookAgain.map((d) => (
                    <PressableScale key={d.name} onPress={() => onCookAgain(d)} disabled={busy}>
                      <View style={styles.chip}>
                        {d.isFavorite && (
                          <MaterialCommunityIcons name="star" size={12} color={colors.takeout} />
                        )}
                        <Text style={styles.chipText} numberOfLines={1}>{d.name}</Text>
                      </View>
                    </PressableScale>
                  ))}
                </ScrollView>
                <View style={styles.divider} />
              </>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={onDecide} disabled={busy} style={styles.action} accessibilityLabel="Decide for me">
                <MaterialCommunityIcons name="dice-multiple" size={18} color={colors.primary} />
                <Text style={styles.actionText}>Decide for me</Text>
              </TouchableOpacity>
              <View style={styles.actionSep} />
              <TouchableOpacity onPress={onLeftovers} disabled={busy} style={styles.action} accessibilityLabel="Log leftovers">
                <MaterialCommunityIcons name="fridge-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>Leftovers</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sectionTitle: {
      fontFamily: Fonts.display,
      fontSize: FontSize.xl,
      color: c.text,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.md,
      // soft depth (premium feel without heavy shadows)
      shadowColor: c.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 1,
    },
    rowLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Spacing.xs,
    },
    chipScroll: { gap: Spacing.sm, paddingVertical: 2, paddingRight: Spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: c.surfaceVariant,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      maxWidth: 190,
    },
    chipText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.text },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginVertical: Spacing.sm },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.xs },
    actionSep: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: c.border },
    actionText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.primary },
    // Suggestion state
    suggestLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    suggestName: { fontFamily: Fonts.display, fontSize: FontSize.xl, color: c.text, marginTop: 2 },
    suggestMeta: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted, marginTop: 1 },
    suggestActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
    grow: { flex: 1 },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: Spacing.sm + 1,
      borderRadius: BorderRadius.full,
    },
    primaryBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm },
    ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
    ghostBtnText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.textSecondary },
    iconBtn: { padding: 6 },
  });

export default QuickActions;
