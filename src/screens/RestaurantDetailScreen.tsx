import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors, makeElevation } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { FadeSlideIn } from '../components/motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getCurrencySymbol } from '../utils/currency';
import { getRestaurantByName, setRestaurantDishRating } from '../services/firestore';
import type { HomeStackScreenProps, RestaurantRange } from '../navigation/types';

type Props = HomeStackScreenProps<'RestaurantDetail'>;

// Time windows for a restaurant's visit stats — identical set to the Restaurants
// list, so the detail opens on the SAME period the user tapped from. Without
// this, tapping a restaurant showed every visit ever — so "2 visits · $100"
// could span years even though the list was filtered to "This month".
const RANGE_ORDER: RestaurantRange[] = ['month', 'lastMonth', '3months', 'all'];
const RANGE_LABELS: Record<RestaurantRange, string> = {
  month: 'This month',
  lastMonth: 'Last month',
  '3months': 'Last 3 months',
  all: 'All',
};
// Closed [start, end] window (yyyy-MM-dd). start '' = no lower bound; end ''
// = up to today. Mirrors RestaurantScreen.getRange so both agree exactly.
function getRange(range: RestaurantRange, now: Date): { start: string; end: string } {
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  switch (range) {
    case 'month':
      return { start: fmt(startOfMonth(now)), end: '' };
    case 'lastMonth':
      return { start: fmt(subMonths(startOfMonth(now), 1)), end: fmt(new Date(now.getFullYear(), now.getMonth(), 0)) };
    case '3months':
      return { start: fmt(subMonths(startOfMonth(now), 2)), end: '' };
    case 'all':
      return { start: '', end: '' };
  }
}

const StarRating: React.FC<{ value: number; onRate: (n: number) => void; color: string; muted: string }> = ({
  value,
  onRate,
  color,
  muted,
}) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Pressable key={n} onPress={() => onRate(n)} hitSlop={6} accessibilityLabel={`Rate ${n} stars`}>
        <MaterialCommunityIcons name={n <= value ? 'star' : 'star-outline'} size={22} color={n <= value ? color : muted} />
      </Pressable>
    ))}
  </View>
);

export const RestaurantDetailScreen: React.FC<Props> = ({ route }) => {
  const { name } = route.params;
  // Open on the same window the user had selected on the Restaurants list.
  const initialRange: RestaurantRange = route.params.range ?? 'month';
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const elevation = useMemo(() => makeElevation(isDark), [isDark]);

  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';
  const { meals, fetchAllMeals } = useMealStore();
  const { preferences } = useHouseholdStore();
  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RestaurantRange>(initialRange);

  useEffect(() => {
    if (householdId) fetchAllMeals(householdId).catch(() => {});
  }, [householdId, fetchAllMeals]);

  useEffect(() => {
    if (!householdId) return;
    getRestaurantByName(householdId, name)
      .then((r) => setRatings(r?.dishRatings ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [householdId, name]);

  const visits = useMemo(() => {
    // Exclude future-dated (planned) meals so counts/spend/dishes match the
    // Restaurants list, which already excludes the future. A planned dine-out
    // isn't a visit yet.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const { start, end } = getRange(range, now);
    const upper = end || today; // never count future/planned meals
    return meals.filter(
      (m) =>
        m.restaurantName?.toLowerCase() === name.toLowerCase() &&
        m.date <= upper &&
        (start === '' || m.date >= start),
    );
  }, [meals, name, range]);

  const totalSpend = useMemo(() => visits.reduce((s, m) => s + (m.cost ?? 0), 0), [visits]);
  const lastVisit = useMemo(() => {
    const dates = visits.map((m) => m.date).sort();
    return dates.length ? dates[dates.length - 1] : '';
  }, [visits]);
  const cuisine = visits.find((m) => m.cuisineTag)?.cuisineTag ?? '';

  // Dishes ordered here, most-ordered first. Counts each dish in a multi-dish
  // order (meal.items); falls back to the single dishName for older entries.
  const dishes = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((m) => {
      if (m.items && m.items.length > 0) {
        m.items.forEach((it) => {
          if (it.name) map.set(it.name, (map.get(it.name) ?? 0) + 1);
        });
      } else if (m.dishName) {
        map.set(m.dishName, (map.get(m.dishName) ?? 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([dishName, count]) => ({ dishName, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  const rate = useCallback(
    (dishName: string, n: number) => {
      setRatings((prev) => ({ ...prev, [dishName]: n }));
      setRestaurantDishRating(householdId, name, dishName, n).catch(() => {});
    },
    [householdId, name],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeSlideIn>
        <Text style={styles.name}>{name}</Text>
        {cuisine ? <Text style={styles.cuisine}>{cuisine}</Text> : null}

        {/* Time window — so visits/spend reflect a chosen period, not all time. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rangeRow}
        >
          {RANGE_ORDER.map((r) => {
            const selected = range === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[styles.rangePill, selected && styles.rangePillSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]} numberOfLines={1}>
                  {RANGE_LABELS[r]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{visits.length}</Text>
            <Text style={styles.statLabel}>visits</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currencySymbol}{totalSpend.toFixed(0)}</Text>
            <Text style={styles.statLabel}>spent</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{lastVisit ? format(parseISO(lastVisit + 'T00:00:00'), 'MMM d') : '—'}</Text>
            <Text style={styles.statLabel}>last visit</Text>
          </View>
        </View>
      </FadeSlideIn>

      <Text style={styles.sectionLabel}>Dishes you've ordered</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: Spacing.lg }} color={colors.primary} />
      ) : dishes.length === 0 ? (
        <Text style={styles.empty}>No dishes logged here yet. Add a meal with this restaurant to track what you order.</Text>
      ) : (
        <View style={[styles.card, elevation.e1]}>
          {dishes.map((d, i) => (
            <View key={d.dishName} style={[styles.dishRow, i > 0 && styles.dishRowBorder]}>
              <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{d.dishName}</Text>
                <Text style={styles.dishCount}>ordered {d.count}×</Text>
              </View>
              <StarRating
                value={ratings[d.dishName] ?? 0}
                onRate={(n) => rate(d.dishName, n)}
                color={colors.takeout}
                muted={colors.border}
              />
            </View>
          ))}
        </View>
      )}
      <Text style={styles.hint}>Tap the stars to remember what to order (or avoid) next time.</Text>
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.md },
    name: { fontFamily: Fonts.display, fontSize: FontSize.xxl, color: c.text },
    cuisine: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
    rangeRow: { gap: Spacing.xs, paddingRight: Spacing.md, marginTop: Spacing.md },
    rangePill: {
      paddingVertical: 7,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.full,
      backgroundColor: c.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rangePillSelected: { backgroundColor: c.primary },
    segmentText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.textSecondary },
    segmentTextSelected: { color: c.white, fontFamily: Fonts.bodySemiBold },
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingVertical: Spacing.md,
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text },
    statLabel: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
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
      paddingHorizontal: Spacing.md,
    },
    dishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
    },
    dishRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    dishInfo: { flex: 1, marginRight: Spacing.sm },
    dishName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    dishCount: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: 1 },
    empty: {
      fontFamily: Fonts.body,
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      lineHeight: 22,
    },
    hint: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', marginTop: Spacing.md },
  });

export default RestaurantDetailScreen;
