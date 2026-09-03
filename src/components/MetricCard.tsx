import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors, makeElevation } from '../config/theme';
import { useTheme } from '../hooks/useTheme';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
  icon?: string;
  onShare?: () => void;
  // Optional progress bar (0..1) under the subtitle — e.g. spend vs budget.
  progress?: number;
  progressColor?: string;
}

// Translucent tint of an accent hex, for the soft icon badge.
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color,
  icon,
  onShare,
  progress,
  progressColor,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const accent = color ?? colors.primary;
  const trendColor = trend !== undefined && trend >= 0 ? colors.success : colors.error;
  const trendIcon = trend !== undefined && trend >= 0 ? 'arrow-up' : 'arrow-down';

  const elevation = useMemo(() => makeElevation(isDark), [isDark]);

  return (
    <Card style={[styles.card, elevation.e1]} accessibilityLabel={`${title}: ${value}`}>
      <Card.Content>
        {onShare && (
          <TouchableOpacity
            onPress={onShare}
            style={styles.shareBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={`Share ${title}`}
          >
            <MaterialCommunityIcons name="share-variant" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconBadge, { backgroundColor: withAlpha(accent, isDark ? 0.24 : 0.14) }]}>
              <MaterialCommunityIcons name={icon as any} size={16} color={accent} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.valueRow}>
          <Text
            style={[styles.value, { color: accent }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {value}
          </Text>
          {trend !== undefined && (
            <View
              style={styles.trendContainer}
              accessibilityLabel={`Trend ${trend >= 0 ? 'up' : 'down'} ${Math.abs(trend)}%`}
            >
              <MaterialCommunityIcons name={trendIcon as any} size={14} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>{Math.abs(trend)}%</Text>
            </View>
          )}
        </View>

        {/* Always reserve the subtitle line so every card is the same height */}
        <View style={styles.subtitleArea}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {/* Reserve the bar slot on every card so a card WITH a progress bar
            (e.g. spend vs budget) stays the same height as the others in the grid. */}
        <View style={styles.progressArea}>
          {progress !== undefined && (
            <View style={styles.progressTrack} accessibilityLabel={`${Math.round(Math.min(1, progress) * 100)} percent`}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: progressColor ?? accent },
                ]}
              />
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      marginVertical: Spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      // Depth comes from the shared elevation system (spread at the call site).
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
    iconBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareBtn: { position: 'absolute', top: 8, right: 8, zIndex: 2, padding: 2 },
    title: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    valueRow: { flexDirection: 'row', alignItems: 'baseline' },
    value: { fontFamily: Fonts.display, fontSize: FontSize.xxxl, flexShrink: 1 },
    trendContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.sm, flexShrink: 0 },
    trendText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, marginLeft: 2 },
    subtitleArea: { minHeight: 18, marginTop: Spacing.xs, justifyContent: 'center' },
    subtitle: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted },
    progressArea: { height: 11, justifyContent: 'flex-end', marginTop: 6 },
    progressTrack: { height: 5, borderRadius: 3, backgroundColor: c.surfaceVariant, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
  });

export default MetricCard;
