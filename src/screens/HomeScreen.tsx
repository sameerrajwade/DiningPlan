import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, differenceInDays, parseISO, startOfMonth, subMonths } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { MetricCard } from '../components/MetricCard';
import { MealCard } from '../components/MealCard';
import { Skeleton } from '../components/Skeleton';
import { ShareStatModal, ShareStat } from '../components/ShareStatModal';
import { FadeSlideIn, PressableScale } from '../components/motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useDishStore } from '../stores/useDishStore';
import { useShoppingStore } from '../stores/useShoppingStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { scheduleDaily } from '../services/notifications';
import { getCurrencySymbol } from '../utils/currency';
import { mealTypeIcon } from '../utils/icons';
import { getFestival } from '../utils/festival';
import { computeLoggingStreak } from '../utils/streak';
import { StreakPill } from '../components/StreakPill';
import { QuickActions } from '../components/QuickActions';
import { cookAgainDishes, decideForMe, isLeftovers, LEFTOVERS_NAME, type CookAgainDish, type Suggestion } from '../utils/quickActions';
import { inferDietFromNames } from '../utils/diet';
import { useTourStore } from '../stores/useTourStore';
import type { HomeStackScreenProps } from '../navigation/types';
import type { MealType } from '../types';

type Props = HomeStackScreenProps<'HomeMain'>;

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [shareStat, setShareStat] = React.useState<ShareStat | null>(null);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';
  const { meals, isLoading: mealsLoading, fetchMeals, dedupeMeals, addMeal, updateMeal } = useMealStore();
  const { dishes, fetchDishes } = useDishStore();
  const groceryItems = useShoppingStore((s) => s.items);
  const fetchGrocery = useShoppingStore((s) => s.fetchItems);
  const { preferences } = useHouseholdStore();

  const [suggestion, setSuggestion] = React.useState<Suggestion | null>(null);
  const [quickBusy, setQuickBusy] = React.useState(false);

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');
  const dineOutBudget = preferences?.monthlyDineOutBudget ?? 0;
  const currencyIcon = (() => {
    switch (preferences?.currency) {
      case 'INR': return 'currency-inr';
      case 'EUR': return 'currency-eur';
      case 'GBP': return 'currency-gbp';
      case 'JPY': return 'currency-jpy';
      case 'CAD': return 'currency-cad';
      default: return 'currency-usd';
    }
  })();

  // Current local date, refreshed on focus so the "this month" window follows the
  // real date across a day/month rollover instead of freezing at mount.
  const [today, setToday] = React.useState(() => format(new Date(), 'yyyy-MM-dd'));
  const thisMonthStart = useMemo(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'), [today]);
  const prevMonthStart = useMemo(() => format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), [today]);

  const loadData = useCallback(async (force = false) => {
    if (!householdId) return;
    await Promise.all([
      fetchMeals(householdId, prevMonthStart, today, force),
      fetchDishes(householdId, force),
      fetchGrocery(householdId, force).catch(() => {}),
    ]);
    // Heal any duplicate meal docs so Home matches Calendar/Plan (which dedupe too).
    await dedupeMeals(householdId).catch(() => {});
  }, [householdId, prevMonthStart, today, fetchMeals, fetchDishes, fetchGrocery, dedupeMeals]);

  useFocusEffect(useCallback(() => {
    setToday(format(new Date(), 'yyyy-MM-dd'));
    loadData();
  }, [loadData]));

  // Family dashboard metrics exclude the kids-tiffin track (shown separately).
  const monthMeals = useMemo(
    () => meals.filter((m) => m.date >= thisMonthStart && m.date <= today && m.audience !== 'kids'),
    [meals, thisMonthStart, today],
  );
  const prevMonthMeals = useMemo(
    () => meals.filter((m) => m.date >= prevMonthStart && m.date < thisMonthStart && m.audience !== 'kids'),
    [meals, prevMonthStart, thisMonthStart],
  );
  const kidsMonthCount = useMemo(
    () => meals.filter((m) => m.date >= thisMonthStart && m.date <= today && m.audience === 'kids').length,
    [meals, thisMonthStart, today],
  );
  const uniqueKidsDishNames = useMemo(
    () =>
      Array.from(
        new Set(
          meals
            .filter((m) => m.date >= thisMonthStart && m.date <= today && m.audience === 'kids' && m.dishName)
            .map((m) => m.dishName),
        ),
      ),
    [meals, thisMonthStart, today],
  );

  const homeCookedPercent = useMemo(() => {
    if (monthMeals.length === 0) return 0;
    return Math.round((monthMeals.filter((m) => m.sourceType === 'home').length / monthMeals.length) * 100);
  }, [monthMeals]);
  const homeCookedTrend = useMemo(() => {
    if (prevMonthMeals.length === 0) return 0;
    const prev = Math.round((prevMonthMeals.filter((m) => m.sourceType === 'home').length / prevMonthMeals.length) * 100);
    return homeCookedPercent - prev;
  }, [prevMonthMeals, homeCookedPercent]);
  // "Outside Meals" = every meal not cooked at home (dine-out + takeout). The
  // card shows the combined total with the breakdown as a subtitle. (Previously
  // this counted dine-out only, so takeouts silently went missing.)
  const ateOut = useMemo(() => {
    const dine = monthMeals.filter((m) => m.sourceType === 'dineout').length;
    const take = monthMeals.filter((m) => m.sourceType === 'takeout').length;
    return { total: dine + take, dine, take };
  }, [monthMeals]);
  // Unique dishes you COOKED — home meals only. Outside meals (dine-out/takeout)
  // carry a dishName too (the ordered dish or restaurant name), so counting them
  // here inflated "Unique Dishes" (e.g. 1 home dish + 1 dine-out showed 2).
  // Distinct dishes actually cooked at home this month — counts thali sides in
  // `items` too (dedup case-insensitively), so it matches the Dish Library's
  // "This month" list you tap into. Excludes the leftovers marker.
  const uniqueDishNames = useMemo(() => {
    const names = new Set<string>();
    monthMeals.forEach((m) => {
      if (m.sourceType !== 'home') return;
      const list = m.items?.length ? m.items.map((it) => it.name) : [m.dishName];
      list.forEach((n) => {
        if (n && !isLeftovers(n)) names.add(n.toLowerCase());
      });
    });
    return Array.from(names);
  }, [monthMeals]);
  const outsideSpending = useMemo(
    () => monthMeals.filter((m) => m.sourceType !== 'home').reduce((s, m) => s + (m.cost ?? 0), 0),
    [monthMeals],
  );
  const outsideSpendingTrend = useMemo(() => {
    const prevSpend = prevMonthMeals.filter((m) => m.sourceType !== 'home').reduce((s, m) => s + (m.cost ?? 0), 0);
    if (prevSpend === 0) return 0;
    return Math.round(((outsideSpending - prevSpend) / prevSpend) * 100);
  }, [prevMonthMeals, outsideSpending]);
  const hasMonthData = monthMeals.length > 0;
  // Grocery quick-entry (Grocery left the bottom bar — Option B IA). Count of
  // items still to buy; the card is the Home entry point into the Grocery list.
  const groceryToBuy = useMemo(() => groceryItems.filter((i) => !i.checked).length, [groceryItems]);

  // Today's meals for every configured meal type (∪ anything logged today).
  const todayTypes = useMemo(() => {
    // Family meal-type rows = enabled defaults ∪ any FAMILY type logged today.
    // Kids meals render in their own section, so they must not add a family row
    // (a kids breakfast was surfacing a phantom empty "Breakfast" family slot).
    const base = new Set<MealType>(preferences?.defaultMeals ?? ['lunch', 'dinner']);
    meals.forEach((m) => {
      if (m.date === today && m.audience !== 'kids') base.add(m.mealType);
    });
    return MEAL_ORDER.filter((t) => base.has(t));
  }, [preferences, meals, today]);

  // If duplicates briefly coexist (before dedupe heals them), keep the most
  // recently updated one — the same record dedupeMeals will preserve — so Home
  // never shows a different copy than Calendar/Plan.
  const newestOf = (list: typeof meals) =>
    list.reduce((a, b) => ((b.updatedAt?.getTime?.() ?? 0) >= (a.updatedAt?.getTime?.() ?? 0) ? b : a));
  const mealForToday = useCallback(
    (t: MealType) => {
      const matches = meals.filter((m) => m.date === today && m.mealType === t && m.audience !== 'kids');
      return matches.length ? newestOf(matches) : null;
    },
    [meals, today],
  );

  const kidsForToday = useMemo(
    () => meals.filter((m) => m.date === today && m.audience === 'kids'),
    [meals, today],
  );

  // Logging streak — the visible habit loop. Any meal (family or kids) counts a
  // day as logged. Drives the Home streak card and the reminder copy.
  const loggedDates = useMemo(() => {
    const dates = new Set<string>();
    meals.forEach((m) => {
      if (m.date && m.date <= today) dates.add(m.date);
    });
    return dates;
  }, [meals, today]);
  const { streak, loggedToday } = useMemo(
    () => computeLoggingStreak(loggedDates, today),
    [loggedDates, today],
  );

  // Keep the daily reminder's text fresh + streak-aware (local notifications
  // carry fixed text, so we re-schedule with current content whenever Home is
  // used). Copy nudges LOGGING and leans on the streak to build the habit.
  const dailyOn = useNotificationStore((s) => s.daily);
  const dailyHour = useNotificationStore((s) => s.dailyHour);
  const notifHydrated = useNotificationStore((s) => s.hydrated);
  // Default-on reminders: once past onboarding, make sure OS permission is in
  // place (prompts contextually here, never at the login screen).
  useEffect(() => {
    if (notifHydrated && householdId) {
      useNotificationStore.getState().assertDaily().catch(() => {});
    }
  }, [notifHydrated, householdId]);
  useEffect(() => {
    if (!notifHydrated || !dailyOn) return;
    const body = loggedToday
      ? streak >= 2
        ? `You're on a ${streak}-day streak. Log again tomorrow to keep it going.`
        : `Logged today — log again tomorrow to build your streak.`
      : streak >= 1
        ? `Keep your ${streak}-day streak alive — log today's meals.`
        : `What did the family eat today? Log it in about 10 seconds.`;
    scheduleDaily(dailyHour, body).catch(() => {});
  }, [dailyOn, dailyHour, notifHydrated, streak, loggedToday]);

  // Dishes not cooked at home in 30+ days, longest-ago first, top 5. Derive the
  // real last-cooked date from actual meals (incl. thali sides in `items`) rather
  // than the stored aggregate, which could be stale and made this list look
  // random. "See all" opens the full stale list in the Dish Library.
  const forgottenDishes = useMemo(() => {
    const now = new Date();
    const lastCooked = new Map<string, string>();
    meals.forEach((m) => {
      if (m.sourceType !== 'home' || m.date > today) return;
      const names = m.items?.length ? m.items.map((it) => it.name) : [m.dishName];
      names.forEach((name) => {
        if (!name || isLeftovers(name)) return;
        const prev = lastCooked.get(name);
        if (!prev || m.date > prev) lastCooked.set(name, m.date);
      });
    });
    return Array.from(lastCooked.entries())
      .map(([name, date]) => ({
        name,
        lastCookedDate: date,
        days: differenceInDays(now, parseISO(date + 'T00:00:00')),
      }))
      .filter((d) => d.days >= 30)
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, [meals, today]);

  // "Cook again" — recent home dishes for 1-tap re-log (excludes leftovers/kids).
  const cookAgain = useMemo(
    () => cookAgainDishes(meals, dishes, today, 8),
    [meals, dishes, today],
  );

  // First-run product tour — auto-start once, after onboarding, when Home is
  // ready. `finish` sets `seen`, so it never re-triggers on its own.
  const tourHydrated = useTourStore((s) => s.hydrated);
  const tourSeen = useTourStore((s) => s.seen);
  const tourActive = useTourStore((s) => s.active);
  const startTour = useTourStore((s) => s.start);
  useEffect(() => {
    if (tourHydrated && !tourSeen && !tourActive && householdId) startTour();
  }, [tourHydrated, tourSeen, tourActive, householdId, startTour]);

  const handleAddMeal = useCallback((mealType?: MealType) => {
    navigation.getParent()?.getParent()?.navigate('AddMeal', mealType ? { mealType } : undefined);
  }, [navigation]);

  const handleMealPress = useCallback(
    (meal: any) => navigation.getParent()?.getParent()?.navigate('AddMeal', { meal }),
    [navigation],
  );

  // One-tap home log used by Cook again / Decide for me / Leftovers. Fills the
  // first empty configured family slot today (else dinner); if that slot is
  // already taken, confirms a replace — mirroring AddMealScreen's dupe guard so
  // quick actions can never silently double-log or create a conflicting slot.
  const quickLog = useCallback(
    async (name: string, cuisine: string, opts?: { leftovers?: boolean }) => {
      if (!householdId || quickBusy) return;
      const defaults = (preferences?.defaultMeals ?? ['lunch', 'dinner']) as MealType[];
      const filledToday = new Set(
        meals.filter((m) => m.date === today && m.audience !== 'kids').map((m) => m.mealType),
      );
      const target: MealType =
        MEAL_ORDER.find((t) => defaults.includes(t) && !filledToday.has(t)) ??
        (defaults.includes('dinner') ? 'dinner' : defaults[defaults.length - 1] ?? 'dinner');

      const mealData = {
        date: today,
        mealType: target,
        sourceType: 'home' as const,
        dishName: name,
        cuisineTag: opts?.leftovers ? '' : cuisine || 'Indian',
        restaurantName: '',
        cost: 0,
        notes: '',
        audience: 'family' as const,
        diet: inferDietFromNames([name]),
        items: opts?.leftovers ? [] : [{ name }],
      };

      const existing = meals.find(
        (m) => m.date === today && m.mealType === target && (m.audience ?? 'family') === 'family',
      );

      setQuickBusy(true);
      try {
        if (existing) {
          await new Promise<void>((resolve, reject) => {
            Alert.alert(
              `${MEAL_LABEL[target]} already logged`,
              `Replace "${existing.dishName}" with "${name}"?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('cancelled')) },
                {
                  text: 'Replace',
                  onPress: () =>
                    updateMeal(householdId, existing.id, mealData).then(resolve).catch(reject),
                },
              ],
            );
          });
        } else {
          await addMeal(householdId, { ...mealData, createdBy: user?.id ?? '', householdId });
        }
        setSuggestion(null);
      } catch {
        // cancelled or failed — leave state untouched
      } finally {
        setQuickBusy(false);
      }
    },
    [householdId, quickBusy, preferences, meals, today, addMeal, updateMeal, user],
  );

  const handleDecide = useCallback(() => {
    const pick = decideForMe(dishes, meals, {
      avoidRepeatDays: preferences?.avoidRepeatDays ?? 0,
    });
    if (!pick) {
      Alert.alert('No dishes yet', 'Log a few home-cooked dishes first, then I can suggest one.');
      return;
    }
    setSuggestion(pick);
  }, [dishes, meals, preferences]);

  const handleCookAgain = useCallback(
    (d: CookAgainDish) => quickLog(d.name, d.cuisineTag),
    [quickLog],
  );

  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] || '';
  const festival = getFestival();
  const greeting = festival
    ? festival.greeting
    : (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
      })();
  const headerWidth = Dimensions.get('window').width;
  const headerHeight = insets.top + 76;

  // "Quick add" placement: when today has nothing logged yet, surface it up top
  // (right under the dashboard) so deciding/logging is the first thing in reach;
  // once the day has meals, it drops to the bottom as a secondary shortcut.
  const todayPlanned =
    todayTypes.some((t) => !!mealForToday(t)) || kidsForToday.length > 0;
  const quickActionsEl =
    meals.length > 0 ? (
      <QuickActions
        colors={colors}
        cookAgain={cookAgain}
        suggestion={suggestion}
        busy={quickBusy}
        onDecide={handleDecide}
        onShuffle={handleDecide}
        onAcceptSuggestion={() => suggestion && quickLog(suggestion.name, suggestion.cuisineTag)}
        onDismissSuggestion={() => setSuggestion(null)}
        onCookAgain={handleCookAgain}
        onLeftovers={() => quickLog(LEFTOVERS_NAME, '', { leftovers: true })}
      />
    ) : null;

  // Grocery entry card — reused in the metrics grid (fills the blank next to
  // Kids Tiffins) and in the empty state, so Grocery is always reachable now
  // that it's no longer a tab.
  const groceryCardEl = (
    <PressableScale onPress={() => navigation.navigate('Grocery')}>
      <MetricCard
        title="Grocery"
        value={groceryToBuy}
        subtitle={groceryToBuy > 0 ? 'items to shop ›' : 'list is clear ›'}
        icon="cart-outline"
        color={colors.success}
      />
    </PressableScale>
  );

  if (!householdId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Please set up your household first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={mealsLoading} onRefresh={() => loadData(true)} tintColor={colors.primary} />}
      >
        {/* Compact header: greeting on the left, brand + tagline on the right —
            a soft terracotta wash keeps the brand feel without eating the screen. */}
        <View style={[styles.brandHeaderWrap, { height: headerHeight }]}>
          <Svg width={headerWidth} height={headerHeight} style={styles.brandWash}>
            <Defs>
              <RadialGradient id="wash" cx="80%" cy="0%" rx="90%" ry="150%">
                <Stop offset="0" stopColor={festival ? colors.takeout : colors.primary} stopOpacity={isDark ? 0.24 : 0.14} />
                <Stop offset="1" stopColor={festival ? colors.takeout : colors.primary} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={headerWidth} height={headerHeight} fill="url(#wash)" />
          </Svg>
          <View style={[styles.brandHeaderRow, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={styles.greetCol}>
              <Text style={styles.greetingCompact} numberOfLines={1}>
                {greeting}{firstName ? `, ${firstName}` : ''}
              </Text>
              <Text style={styles.brandTaglineCompact} numberOfLines={1}>Your family's meal memory</Text>
            </View>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={colors.primary} />
              <Text style={styles.brandNameCompact}>Sofra</Text>
            </View>
          </View>
        </View>

        {/* "This month" header with the logging-streak pill on the right (the
            visible habit loop). Pill shows once there's any history. */}
        <View style={styles.monthHeaderRow}>
          <Text style={[styles.sectionTitle, styles.monthHeaderTitle]}>This month</Text>
          {meals.length > 0 && (
            <StreakPill
              streak={streak}
              loggedToday={loggedToday}
              onPress={() => handleAddMeal()}
            />
          )}
        </View>
        {mealsLoading && monthMeals.length === 0 ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : hasMonthData ? (
          <FadeSlideIn>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCol}>
                <PressableScale onPress={() => navigation.getParent()?.navigate('Insights')}>
                  <MetricCard title="Home Cooked" value={`${homeCookedPercent}%`} trend={homeCookedTrend} icon="pot-steam" color={colors.home} />
                </PressableScale>
              </View>
              <View style={styles.metricCol}>
                <PressableScale onPress={() => navigation.navigate('Restaurants')}>
                  <MetricCard title="Outside Meals" value={ateOut.total} subtitle={`${ateOut.dine} dine · ${ateOut.take} takeout`} icon="store" color={colors.dineout} />
                </PressableScale>
              </View>
              <View style={styles.metricCol}>
                <PressableScale onPress={() => navigation.navigate('DishLibrary', { audience: 'family', view: 'month' })}>
                  <MetricCard
                    title="Unique Dishes"
                    value={uniqueDishNames.length}
                    icon="food-variant"
                    color={colors.primary}
                    onShare={() =>
                      setShareStat({
                        headline: 'Unique dishes this month',
                        value: `${uniqueDishNames.length}`,
                        sub: 'Cooking with variety',
                        accent: colors.primary,
                      })
                    }
                  />
                </PressableScale>
              </View>
              <View style={styles.metricCol}>
                <PressableScale onPress={() => navigation.getParent()?.navigate('Insights')}>
                  <MetricCard
                    title="Outside Spend"
                    value={`${currencySymbol}${outsideSpending.toFixed(0)}`}
                    trend={outsideSpendingTrend}
                    icon={currencyIcon}
                    color={colors.takeout}
                    subtitle={dineOutBudget > 0 ? `of ${currencySymbol}${dineOutBudget} budget` : undefined}
                    progress={dineOutBudget > 0 ? outsideSpending / dineOutBudget : undefined}
                    progressColor={outsideSpending > dineOutBudget ? colors.error : colors.home}
                  />
                </PressableScale>
              </View>
              {kidsMonthCount > 0 && (
                <View style={styles.metricCol}>
                  <PressableScale
                    onPress={() =>
                      navigation.navigate('DishLibrary', { audience: 'kids', view: 'month' })
                    }
                  >
                    <MetricCard
                      title="Kids Tiffins"
                      value={kidsMonthCount}
                      subtitle={`${uniqueKidsDishNames.length} unique ${uniqueKidsDishNames.length === 1 ? 'dish' : 'dishes'}`}
                      icon="emoticon-happy-outline"
                      color={colors.kids}
                    />
                  </PressableScale>
                </View>
              )}
              {/* Grocery entry — fills the blank half-cell next to Kids Tiffins;
                  spans full width when there's no kids card to pair with. */}
              <View style={[styles.metricCol, kidsMonthCount > 0 ? null : styles.metricColFull]}>
                {groceryCardEl}
              </View>
            </View>
          </FadeSlideIn>
        ) : (
          <View style={styles.emptyBlock}>
            <Svg width={80} height={80} viewBox="0 0 80 80">
              <Circle cx="40" cy="40" r="30" stroke={colors.border} strokeWidth="2.5" fill="none" />
              <Circle cx="40" cy="40" r="18" stroke={colors.primary} strokeWidth="2" strokeDasharray="3 5" fill="none" opacity={0.55} />
              <Circle cx="40" cy="22" r="3" fill={colors.primary} opacity={0.5} />
            </Svg>
            <Text style={styles.emptyTitle}>Start your meal memory</Text>
            <Text style={styles.emptyText}>
              Tap the + button to log your first meal. Your dashboard fills in as you go.
            </Text>
            <View style={styles.emptyGrocery}>{groceryCardEl}</View>
          </View>
        )}

        {!todayPlanned && quickActionsEl}

        <Text style={styles.sectionTitle}>Today's meals</Text>
        {mealsLoading && meals.length === 0 ? (
          <View style={styles.todayMeals}>
            {[0, 1].map((i) => (
              <View key={i}>
                <Skeleton width={64} height={11} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }} />
                <Skeleton height={64} radius={BorderRadius.md} style={{ marginVertical: Spacing.xs }} />
              </View>
            ))}
          </View>
        ) : (
        <View style={styles.todayMeals}>
          {todayTypes.map((t) => {
            const meal = mealForToday(t);
            return (
              <View key={t}>
                <View style={styles.mealLabelRow}>
                  <MaterialCommunityIcons name={mealTypeIcon(t) as any} size={13} color={colors.textMuted} />
                  <Text style={styles.mealLabel}>{MEAL_LABEL[t]}</Text>
                </View>
                <MealCard
                  meal={meal}
                  placeholder={`No ${MEAL_LABEL[t].toLowerCase()} planned`}
                  onPress={() => (meal ? handleMealPress(meal) : handleAddMeal(t))}
                />
              </View>
            );
          })}
        </View>
        )}

        {kidsForToday.length > 0 && (
          <>
            <View style={styles.mealLabelRow}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={13} color={colors.kids} />
              <Text style={[styles.mealLabel, { color: colors.kids }]}>Kids tiffin</Text>
            </View>
            {kidsForToday.map((meal) => (
              <MealCard key={meal.id} meal={meal} onPress={() => handleMealPress(meal)} />
            ))}
          </>
        )}

        {todayPlanned && quickActionsEl}

        {forgottenDishes.length > 0 && (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('DishLibrary', { view: 'stale' })}>
              <Text style={styles.sectionTitle}>Dishes you haven't made in a while {'›'}</Text>
            </TouchableOpacity>
            {forgottenDishes.map((item) => (
              <View key={item.name} style={styles.forgottenRow}>
                <Text style={styles.forgottenName}>{item.name}</Text>
                <Text style={styles.forgottenDays}>{item.days} days ago</Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => navigation.navigate('DishLibrary', { view: 'stale' })}
              style={styles.seeAllRow}
            >
              <Text style={styles.seeAllText}>See all dishes not made in 30+ days {'›'}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Sofra</Text>
          <View style={styles.footerLine} />
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => handleAddMeal()} color={colors.white} accessibilityLabel="Add meal" />

      <ShareStatModal stat={shareStat} onClose={() => setShareStat(null)} />
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl + Spacing.xl },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    loader: { marginVertical: Spacing.lg },
    sectionTitle: {
      fontFamily: Fonts.display,
      fontSize: FontSize.xl,
      color: c.text,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    monthHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: Spacing.sm },
    monthHeaderTitle: { marginBottom: 0 },
    brandHeaderWrap: {
      marginHorizontal: -Spacing.md, // full-bleed wash to screen edges
      marginBottom: Spacing.xs,
      justifyContent: 'flex-end',
    },
    brandWash: { position: 'absolute', top: 0, left: 0 },
    brandHeaderRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      gap: Spacing.md,
    },
    greetCol: { flex: 1, minWidth: 0 },
    greetingCompact: {
      fontFamily: Fonts.display,
      fontSize: FontSize.xl,
      color: c.text,
    },
    brandTaglineCompact: {
      fontFamily: Fonts.body,
      fontSize: FontSize.xs,
      color: c.textSecondary,
      marginTop: 1,
    },
    brandMark: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: BorderRadius.full,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    brandNameCompact: {
      fontFamily: Fonts.display,
      fontSize: FontSize.lg,
      color: c.text,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
    footerLine: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, flex: 1, maxWidth: 60 },
    footerText: {
      fontFamily: Fonts.display,
      fontSize: FontSize.md,
      color: c.textMuted,
      letterSpacing: 1,
    },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -Spacing.xs },
    metricCol: { width: '50%', paddingHorizontal: Spacing.xs },
    metricColFull: { width: '100%', paddingHorizontal: Spacing.xs },
    emptyGrocery: { alignSelf: 'stretch', marginTop: Spacing.lg },
    todayMeals: { marginBottom: Spacing.sm },
    mealLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    mealLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    emptyBlock: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
    emptyTitle: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text, marginTop: Spacing.sm },
    emptyText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textMuted, textAlign: 'center', marginVertical: Spacing.xs, paddingHorizontal: Spacing.lg, lineHeight: 21 },
    forgottenRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    forgottenName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    forgottenDays: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted },
    seeAllRow: { paddingVertical: Spacing.sm, alignItems: 'flex-start' },
    seeAllText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.primary },
    fab: {
      position: 'absolute',
      right: Spacing.md,
      bottom: Spacing.md,
      backgroundColor: c.primary,
      borderRadius: BorderRadius.full,
    },
  });

export default HomeScreen;
