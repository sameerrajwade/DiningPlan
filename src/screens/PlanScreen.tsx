import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  Chip,
  IconButton,
  ActivityIndicator,
  Badge,
  Portal,
  Dialog,
  TextInput,
  Switch,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, parseISO, startOfWeek, endOfWeek, addWeeks, isToday } from 'date-fns';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { generateMealPlan } from '../services/planner';
import { Celebration } from '../components/Celebration';
import { useDishStore } from '../stores/useDishStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useShoppingStore } from '../stores/useShoppingStore';
import { ingredientsForDishes } from '../utils/grocery';
import { matchCatalogDish } from '../utils/starterDishes';
import type { MealPlan, MealPlanSlot, Meal } from '../types';
import type { MainTabScreenProps } from '../navigation/types';


const EMPTY_SLOT = { dishName: '', sourceType: 'home' as const, isNew: false, lastMadeDaysAgo: 0 };

// Build a full 7-day plan for the week from saved meals; empty slots stay blank.
function savedWeekToPlan(weekMeals: Meal[], weekStart: Date): MealPlan[] {
  const plan: MealPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
    const lunch = weekMeals.find((m) => m.date === date && m.mealType === 'lunch' && m.audience !== 'kids');
    const dinner = weekMeals.find((m) => m.date === date && m.mealType === 'dinner' && m.audience !== 'kids');
    const kids = weekMeals.find((m) => m.date === date && m.audience === 'kids');
    plan.push({
      date,
      lunch: lunch
        ? { dishName: lunch.dishName, sourceType: lunch.sourceType, isNew: false, lastMadeDaysAgo: 0, restaurantName: lunch.restaurantName }
        : { ...EMPTY_SLOT },
      dinner: dinner
        ? { dishName: dinner.dishName, sourceType: dinner.sourceType, isNew: false, lastMadeDaysAgo: 0, restaurantName: dinner.restaurantName }
        : { ...EMPTY_SLOT },
      ...(kids ? { kids: { dishName: kids.dishName, sourceType: kids.sourceType, isNew: false, lastMadeDaysAgo: 0 } } : {}),
    });
  }
  return plan;
}

export const PlanScreen: React.FC<MainTabScreenProps<'Plan'>> = ({ navigation, route }) => {
  const { dishes, fetchDishes } = useDishStore();
  const { meals, addMeal, fetchAllMeals, deleteMeal, dedupeMeals } = useMealStore();
  const { preferences, household, updatePreferences } = useHouseholdStore();
  const { user } = useAuthStore();
  const addGroceryItems = useShoppingStore((s) => s.addItems);
  const [addingGrocery, setAddingGrocery] = useState(false);
  const householdId = user?.householdId ?? '';
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [plan, setPlan] = useState<MealPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  // The saved-plan explainer is a first-time hint — dismiss it permanently.
  const [hintDismissed, setHintDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('planHintDismissed')
      .then((v) => setHintDismissed(v === '1'))
      .catch(() => setHintDismissed(false));
  }, []);

  const dismissHint = useCallback(() => {
    setHintDismissed(true);
    AsyncStorage.setItem('planHintDismissed', '1').catch(() => {});
  }, []);
  // isDirty = the displayed plan has unsaved generated content (needs "Accept").
  // When false, the plan mirrors what's already saved for this week.
  const [isDirty, setIsDirty] = useState(false);
  const [editIndex, setEditIndex] = useState<{ dayIdx: number; slot: 'lunch' | 'dinner' } | null>(null);
  const [editDishName, setEditDishName] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const [weekOffset, setWeekOffset] = useState(0);
  // Align the plan window to the Mon–Sun calendar week, matching Calendar & Insights.
  const weekStartDate = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  );
  const weekEndDate = useMemo(
    () => endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  );
  const startDate = format(weekStartDate, 'yyyy-MM-dd');
  const endDate = format(weekEndDate, 'yyyy-MM-dd');
  const dateRangeLabel = `${format(weekStartDate, 'MMM d')} – ${format(weekEndDate, 'MMM d')}`;

  const defaultPrefs = preferences ?? {
    defaultMeals: ['lunch', 'dinner'] as const,
    monthlyDineOutBudget: 5000,
    dishRotationDays: 7,
    currency: 'INR',
    maxDineOutsPerWeek: 2,
    avoidRepeatDays: 3,
    includeNewDishes: true,
  };

  useEffect(() => {
    if (!householdId) return;
    Promise.all([
      fetchDishes(householdId).catch(() => {}),
      fetchAllMeals(householdId).catch(() => {}),
    ])
      .then(() => dedupeMeals(householdId).catch(() => {}))
      .then(() => setDataLoaded(true));
  }, [householdId]);

  // When the week changes, drop any unsaved generated plan.
  useEffect(() => {
    setIsDirty(false);
  }, [weekOffset]);

  // While not reviewing a generated plan, mirror whatever is saved for this week
  // (a full 7 days with blanks for unplanned slots).
  useEffect(() => {
    if (!dataLoaded || isDirty) return;
    const weekMeals = meals.filter((m) => m.date >= startDate && m.date <= endDate);
    setPlan(savedWeekToPlan(weekMeals, weekStartDate));
  }, [dataLoaded, isDirty, meals, startDate, endDate, weekStartDate]);

  useEffect(() => {
    if (!isDirty) return;
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      e.preventDefault();
      Alert.alert(
        'Unsaved plan',
        'You have a generated plan that hasn\'t been accepted. Leave anyway?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const allDishes = useMemo(() => {
    const dishMap = new Map<string, typeof dishes[0]>();
    dishes.forEach((d) => dishMap.set(d.name.toLowerCase(), d));
    meals.forEach((m) => {
      // Only home dishes are plannable — you plan what you'll COOK. A dish only
      // ever ordered out (e.g. "Dosa" at a restaurant) must not become a home
      // dinner suggestion.
      if (m.sourceType !== 'home') return;
      if (m.dishName && !dishMap.has(m.dishName.toLowerCase())) {
        dishMap.set(m.dishName.toLowerCase(), {
          id: m.dishName,
          name: m.dishName,
          cuisineTag: m.cuisineTag || 'Other',
          categoryTags: [],
          isFavorite: false,
          timesCooked: 1,
          lastCookedDate: m.date,
          householdId: m.householdId,
        });
      }
    });
    return Array.from(dishMap.values());
  }, [dishes, meals]);

  // mode 'fill' → keep already-planned slots, only generate empty future ones.
  // mode 'all'  → regenerate every future slot (explicit user action).
  const generate = useCallback(
    (mode: 'fill' | 'all' = 'fill') => {
      if (allDishes.length === 0) {
        Alert.alert('No dishes yet', 'Add some meals first so Sofra can learn your preferences and generate a plan.');
        return;
      }
      setIsGenerating(true);
      try {
        const generated = generateMealPlan(allDishes, meals, defaultPrefs, startDate, 7);
        const genByDate = new Map(generated.map((g) => [g.date, g]));
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const toSlot = (m: Meal) => ({
          dishName: m.dishName,
          sourceType: m.sourceType,
          isNew: false,
          lastMadeDaysAgo: 0,
          restaurantName: m.restaurantName,
        });

        const next: MealPlan[] = [];
        for (let i = 0; i < 7; i++) {
          const date = format(addDays(weekStartDate, i), 'yyyy-MM-dd');
          const gen = genByDate.get(date);
          const canGenerate = date >= todayStr && !!gen; // never plan the past
          // Exclude kids tiffins — they're stored with mealType 'lunch' but must
          // not populate the FAMILY lunch/dinner slots (would leak a kids dish
          // into the family track and duplicate it on accept).
          const savedLunch = meals.find((m) => m.date === date && m.mealType === 'lunch' && m.audience !== 'kids');
          const savedDinner = meals.find((m) => m.date === date && m.mealType === 'dinner' && m.audience !== 'kids');

          const savedKids = meals.find((m) => m.date === date && m.audience === 'kids');

          let lunch: MealPlan['lunch'];
          let dinner: MealPlan['dinner'];
          let kids: MealPlan['kids'];
          if (mode === 'all') {
            lunch = canGenerate ? gen!.lunch : savedLunch ? toSlot(savedLunch) : { ...EMPTY_SLOT };
            dinner = canGenerate ? gen!.dinner : savedDinner ? toSlot(savedDinner) : { ...EMPTY_SLOT };
            kids = canGenerate ? gen!.kids : savedKids ? toSlot(savedKids) : undefined;
          } else {
            // fill: preserve any already-planned slot, generate only empty future slots
            lunch = savedLunch ? toSlot(savedLunch) : canGenerate ? gen!.lunch : { ...EMPTY_SLOT };
            dinner = savedDinner ? toSlot(savedDinner) : canGenerate ? gen!.dinner : { ...EMPTY_SLOT };
            kids = savedKids ? toSlot(savedKids) : canGenerate ? gen!.kids : undefined;
          }
          next.push({ date, lunch, dinner, ...(kids ? { kids } : {}) });
        }
        setPlan(next);
        setIsDirty(true);
      } finally {
        setIsGenerating(false);
      }
    },
    [allDishes, meals, defaultPrefs, startDate, weekStartDate],
  );

  // Weekly reminder deep-link: open with a fresh auto-plan. Runs once per param
  // arrival, only when the library has dishes and nothing's already unsaved, then
  // clears the param so it won't re-fire on the next visit.
  useEffect(() => {
    if (route.params?.autoGenerate && dataLoaded && allDishes.length > 0 && !isDirty) {
      generate('all');
      navigation.setParams({ autoGenerate: undefined });
    }
  }, [route.params?.autoGenerate, dataLoaded, allDishes.length, isDirty, generate, navigation]);

  const refreshDay = useCallback(
    (dayIdx: number) => {
      if (allDishes.length === 0) return;
      // Never regenerate a past day — accept won't persist it, so showing a new
      // dish there is just confusing.
      if (plan[dayIdx] && plan[dayIdx].date < format(new Date(), 'yyyy-MM-dd')) return;
      const dayPlan = generateMealPlan(
        allDishes,
        meals,
        defaultPrefs,
        plan[dayIdx].date,
        1,
      );
      setPlan((prev) => prev.map((p, i) => (i === dayIdx ? dayPlan[0] : p)));
      setIsDirty(true);
    },
    [allDishes, meals, defaultPrefs, plan],
  );

  const openEdit = (dayIdx: number, slot: 'lunch' | 'dinner') => {
    if (!isDirty) return; // saved view is read-only; generate/regenerate to edit
    setEditIndex({ dayIdx, slot });
    setEditDishName(plan[dayIdx][slot].dishName);
  };

  const confirmEdit = () => {
    if (!editIndex || !editDishName.trim()) return;
    setPlan((prev) =>
      prev.map((p, i) => {
        if (i !== editIndex.dayIdx) return p;
        return {
          ...p,
          [editIndex.slot]: {
            ...p[editIndex.slot],
            dishName: editDishName.trim(),
            isNew: !dishes.some((d) => d.name === editDishName.trim()),
            lastMadeDaysAgo: 0,
          },
        };
      }),
    );
    setEditIndex(null);
    setEditDishName('');
  };

  // "Add this week's ingredients to grocery" — gathers the ingredients of every
  // HOME dish in the current plan (dine-out slots have none), de-dupes them, and
  // adds them to the shared grocery list. This is how a planned week turns into a
  // shopping list; ingredients that aren't on a dish yet simply won't appear
  // (the user curates them on the dish via the detail sheet).
  const addWeekIngredients = useCallback(async () => {
    if (!householdId) return;
    const homeNames = plan
      .flatMap((d) => [d.lunch, d.dinner, d.kids] as (MealPlanSlot | undefined)[])
      .filter((s): s is MealPlanSlot => !!s && s.sourceType === 'home' && !!s.dishName && s.dishName !== 'Dine Out')
      .map((s) => s.dishName);
    const uniqueNames = Array.from(new Set(homeNames));
    const byName = new Map(dishes.map((d) => [d.name.toLowerCase(), d]));
    // Prefer saved dish ingredients; fall back to the curated catalog so dishes
    // whose ingredients only live in the catalog still contribute.
    const ingLists = uniqueNames.map((n) => {
      const saved = byName.get(n.toLowerCase())?.ingredients;
      return saved?.length ? saved : matchCatalogDish(n)?.ingredients;
    });
    const toAdd = ingredientsForDishes(ingLists);
    if (toAdd.length === 0) {
      Alert.alert(
        'No ingredients yet',
        "None of this week's dishes have ingredients saved. Open a dish in your Dish Library, add its ingredients, then try again.",
      );
      return;
    }
    setAddingGrocery(true);
    try {
      const added = await addGroceryItems(householdId, toAdd, 'dish');
      Alert.alert(
        'Grocery list updated',
        added > 0
          ? `Added ${added} ${added === 1 ? 'item' : 'items'} to your grocery list.`
          : "Those ingredients are already on your grocery list.",
      );
    } catch {
      Alert.alert('Could not add', 'Something went wrong updating the grocery list. Please try again.');
    } finally {
      setAddingGrocery(false);
    }
  }, [householdId, plan, dishes, addGroceryItems]);

  const planHasHomeDish = useMemo(
    () => plan.some((d) => d.lunch?.sourceType === 'home' || d.dinner?.sourceType === 'home' || d.kids?.sourceType === 'home'),
    [plan],
  );

  const acceptPlan = useCallback(async () => {
    if (!householdId || !user) {
      Alert.alert('Error', 'No household set up. Please set up your household first.');
      return;
    }
    setIsAccepting(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      // Only accept today-or-future days; never rewrite/churn past history.
      const daysToSave = plan.filter((d) => d.date >= todayStr);
      const saveDates = new Set(daysToSave.map((d) => d.date));

      const kidsOn = !!preferences?.planKidsTiffin;

      // Delete existing FAMILY meals for those dates so stale plan records don't
      // persist. Kids meals are only cleared on dates where the plan actually has
      // a replacement kids dish — otherwise (weekends, empty kids pool) we'd delete
      // a kids tiffin the accept never rewrites, permanently losing it.
      const kidsReplaceDates = new Set(
        daysToSave.filter((d) => d.kids?.dishName).map((d) => d.date),
      );
      const staleIds = meals
        .filter((m) => {
          if (!saveDates.has(m.date)) return false;
          if (m.audience === 'kids') return kidsOn && kidsReplaceDates.has(m.date);
          return true; // family meal on a save date — always refreshed
        })
        .map((m) => m.id);
      await Promise.all(staleIds.map((id) => deleteMeal(householdId, id)));

      // Write the new plan
      for (const day of daysToSave) {
        if (day.lunch.dishName) {
          const matchedDish = allDishes.find((d) => d.name === day.lunch.dishName);
          await addMeal(
            householdId,
            {
              date: day.date,
              mealType: 'lunch',
              sourceType: day.lunch.sourceType,
              dishName: day.lunch.dishName,
              cuisineTag: matchedDish?.cuisineTag || 'Other',
              createdBy: user.id,
              householdId,
            },
            { trackStats: false },
          );
        }
        if (day.dinner.dishName) {
          const matchedDish = allDishes.find((d) => d.name === day.dinner.dishName);
          await addMeal(
            householdId,
            {
              date: day.date,
              mealType: 'dinner',
              sourceType: day.dinner.sourceType,
              dishName: day.dinner.dishName,
              cuisineTag: matchedDish?.cuisineTag || 'Other',
              createdBy: user.id,
              householdId,
            },
            { trackStats: false },
          );
        }
        if (kidsOn && day.kids?.dishName) {
          const matchedDish = allDishes.find((d) => d.name === day.kids!.dishName);
          await addMeal(
            householdId,
            {
              date: day.date,
              mealType: 'lunch',
              sourceType: day.kids.sourceType,
              dishName: day.kids.dishName,
              cuisineTag: matchedDish?.cuisineTag || 'Other',
              audience: 'kids',
              createdBy: user.id,
              householdId,
            },
            { trackStats: false },
          );
        }
      }
      // Clearing dirty lets the mirror effect re-render from the freshly saved meals
      setIsDirty(false);
      // Celebrate the win first, then surface the confirmation so the burst is seen.
      setCelebrate(true);
      setTimeout(() => {
        Alert.alert('Plan saved!', 'Your meal plan has been added to the calendar.', [
          { text: 'View Calendar', onPress: () => navigation.navigate('Calendar' as any) },
          { text: 'OK' },
        ]);
      }, 850);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save plan.');
    } finally {
      setIsAccepting(false);
    }
  }, [plan, householdId, user, allDishes, meals, addMeal, navigation, preferences]);

  const kidsOn = !!preferences?.planKidsTiffin;
  const toggleKidsTrack = useCallback(async () => {
    if (!user) return;
    try {
      await updatePreferences(user.id, { planKidsTiffin: !kidsOn });
    } catch {
      // best-effort; the kids track appears when you next generate the plan
    }
  }, [user, kidsOn, updatePreferences]);

  const daysAgoColor = (days: number) => {
    if (days > 60) return colors.error;
    if (days < 30) return colors.success;
    return colors.textSecondary;
  };
  const srcColor = (s: string) =>
    s === 'dineout' ? colors.dineout : s === 'takeout' ? colors.takeout : colors.home;

  // Outside (dine-out/takeout) slots lead with the restaurant name — matching how
  // Calendar/Home render them — with the ordered dish as a secondary line.
  const isOutsideSlot = (s: MealPlan['lunch']) =>
    s.sourceType === 'dineout' || s.sourceType === 'takeout';
  const slotPrimary = (s: MealPlan['lunch']) =>
    isOutsideSlot(s) && s.restaurantName ? s.restaurantName : s.dishName || '—';
  const slotSub = (s: MealPlan['lunch']) =>
    isOutsideSlot(s) && s.restaurantName && s.dishName &&
    s.dishName.toLowerCase() !== s.restaurantName.toLowerCase()
      ? s.dishName
      : '';

  // Any saved (already-planned) content in the displayed week?
  const hasSaved = useMemo(
    () => plan.some((d) => d.lunch.dishName || d.dinner.dishName),
    [plan],
  );
  // Any empty slot from today onward that "Generate" could fill?
  const hasGaps = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return plan.some((d) => d.date >= todayStr && (!d.lunch.dishName || !d.dinner.dishName));
  }, [plan]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  if (isGenerating && plan.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating your meal plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.sm }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="auto-fix" size={28} color={colors.primary} />
            <Text style={styles.headerTitle}>Plan your week</Text>
          </View>
          <View style={styles.weekNav}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={() => setWeekOffset((w) => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
            />
            <Text style={styles.weekLabel}>{dateRangeLabel}</Text>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => setWeekOffset((w) => w + 1)}
            />
          </View>
          <Text style={styles.subtitle}>
            {isDirty
              ? 'Review and accept your plan'
              : hasGaps
              ? hasSaved
                ? 'Some days are planned — generate to fill the rest'
                : 'No plan yet for this week'
              : 'Upcoming days are all planned'}
          </Text>
        </View>

        {/* Info banner — only while reviewing a freshly generated plan */}
        {isDirty && (
          <Surface style={styles.infoBanner} elevation={1}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              This plan avoids dishes you made in the last {defaultPrefs.avoidRepeatDays} days,
              mixes cuisines, and reserves weekend dinners for dining out. Already-planned days are kept as-is.
            </Text>
          </Surface>
        )}

        {/* Preference chips */}
        <View style={styles.chipRow}>
          <Chip icon="food-off" style={styles.chip} textStyle={styles.chipText}>
            Max {defaultPrefs.maxDineOutsPerWeek} dine-outs
          </Chip>
          <Chip icon="palette-swatch" style={styles.chip} textStyle={styles.chipText}>
            Mix cuisines
          </Chip>
          {defaultPrefs.includeNewDishes && (
            <Chip icon="new-box" style={styles.chip} textStyle={styles.chipText}>
              Include new
            </Chip>
          )}
        </View>

        {/* Kids tiffin track toggle */}
        <Surface style={styles.kidsToggle} elevation={1}>
          <MaterialCommunityIcons name="emoticon-happy-outline" size={20} color={colors.kids} />
          <Text style={styles.kidsToggleText}>Include kids tiffin</Text>
          <Switch value={kidsOn} onValueChange={toggleKidsTrack} color={colors.kids} />
        </Surface>

        {/* Saved plan explainer — first-time hint, dismissible */}
        {!isDirty && hasSaved && !hintDismissed && (
          <Surface style={styles.calendarBanner} elevation={1}>
            <MaterialCommunityIcons name="calendar-check" size={20} color={colors.home} />
            <Text style={styles.calendarBannerText}>
              Saved days are shown below. Edit individual entries in the Calendar tab, generate to fill any empty days, or regenerate a completely new plan.
            </Text>
            <IconButton
              icon="close"
              size={16}
              onPress={dismissHint}
              accessibilityLabel="Dismiss"
              style={styles.calendarBannerClose}
            />
          </Surface>
        )}

        {/* Thin-pool nudge — you CAN generate with 1-2 dishes, but plans will be
            repetitive. Nudge for more variety without gating generation. */}
        {allDishes.length > 0 && allDishes.length < 3 && (
          <Surface style={styles.calendarBanner} elevation={1}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.primary} />
            <Text style={styles.calendarBannerText}>
              You can generate a plan now, but adding a few more home dishes gives Sofra more variety to work with.
            </Text>
          </Surface>
        )}

        {/* Plan list */}
        {plan.map((day, idx) => {
          const date = parseISO(day.date);
          const isDayToday = isToday(date);
          // Past days are never plannable — populating them would be fake data.
          // Mute them and mark "Past" so a blank past day reads as "already gone",
          // not "missing from your plan". Logged past meals still show through.
          const isPast = day.date < todayStr;
          return (
            <Surface
              key={day.date}
              style={[styles.dayRow, isDayToday && styles.dayRowToday, isPast && styles.dayRowPast]}
              elevation={isPast ? 0 : 1}
            >
              <View style={styles.dayHeader}>
                <View style={styles.dayNameRow}>
                  <Text style={[styles.dayName, isDayToday && styles.todayText]}>{format(date, 'EEEE')}</Text>
                  {isDayToday && (
                    <View style={styles.todayPill}>
                      <Text style={styles.todayPillText}>Today</Text>
                    </View>
                  )}
                  {isPast && (
                    <View style={styles.pastPill}>
                      <Text style={styles.pastPillText}>Past</Text>
                    </View>
                  )}
                </View>
                <View style={styles.dayNameRow}>
                  <Text style={[styles.dayDate, isDayToday && styles.todayText]}>{format(date, 'MMM d')}</Text>
                  {isDirty && (
                    <IconButton
                      icon="refresh"
                      size={18}
                      iconColor={colors.textSecondary}
                      onPress={() => refreshDay(idx)}
                      style={styles.refreshBtn}
                    />
                  )}
                </View>
              </View>
              <View style={styles.mealRow}>
                {/* Lunch */}
                <View style={styles.mealSlot}>
                  <View style={styles.mealTypeRow}>
                    {day.lunch.dishName ? <View style={[styles.srcDot, { backgroundColor: srcColor(day.lunch.sourceType) }]} /> : null}
                    <Text style={styles.mealTypeLabel}>Lunch</Text>
                  </View>
                  <Text
                    style={[styles.dishName, !isDirty && styles.dishNameReadOnly]}
                    onPress={() => openEdit(idx, 'lunch')}
                    numberOfLines={1}
                  >
                    {slotPrimary(day.lunch)}
                  </Text>
                  {slotSub(day.lunch) ? (
                    <Text style={styles.restSub} numberOfLines={1}>{slotSub(day.lunch)}</Text>
                  ) : null}
                  {isDirty && day.lunch.sourceType === 'home' && (
                    <View style={styles.dishMeta}>
                      {day.lunch.isNew ? (
                        <Badge style={styles.newBadge} size={18}>New!</Badge>
                      ) : day.lunch.dishName ? (
                        <Text style={[styles.daysAgoText, { color: daysAgoColor(day.lunch.lastMadeDaysAgo) }]}>
                          {day.lunch.lastMadeDaysAgo}d ago
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
                {/* Dinner */}
                <View style={styles.mealSlot}>
                  <View style={styles.mealTypeRow}>
                    {day.dinner.dishName ? <View style={[styles.srcDot, { backgroundColor: srcColor(day.dinner.sourceType) }]} /> : null}
                    <Text style={styles.mealTypeLabel}>Dinner</Text>
                  </View>
                  <Text
                    style={[styles.dishName, !isDirty && styles.dishNameReadOnly]}
                    onPress={() => openEdit(idx, 'dinner')}
                    numberOfLines={1}
                  >
                    {slotPrimary(day.dinner)}
                  </Text>
                  {slotSub(day.dinner) ? (
                    <Text style={styles.restSub} numberOfLines={1}>{slotSub(day.dinner)}</Text>
                  ) : null}
                  {isDirty && day.dinner.sourceType === 'home' && (
                    <View style={styles.dishMeta}>
                      {day.dinner.isNew ? (
                        <Badge style={styles.newBadge} size={18}>New!</Badge>
                      ) : day.dinner.dishName ? (
                        <Text style={[styles.daysAgoText, { color: daysAgoColor(day.dinner.lastMadeDaysAgo) }]}>
                          {day.dinner.lastMadeDaysAgo}d ago
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>
              {kidsOn && day.kids && (
                <View style={styles.kidsSlotRow}>
                  <View style={styles.kidsLabelRow}>
                    <MaterialCommunityIcons name="emoticon-happy-outline" size={13} color={colors.kids} />
                    <Text style={[styles.mealTypeLabel, { color: colors.kids }]}>Kids tiffin</Text>
                  </View>
                  <Text style={styles.dishName} numberOfLines={1}>
                    {day.kids.dishName || '—'}
                  </Text>
                </View>
              )}
            </Surface>
          );
        })}

        {/* Action buttons */}
        <View style={styles.actions}>
          {isDirty ? (
            <>
              <Button
                mode="outlined"
                icon="refresh"
                onPress={() => generate('all')}
                loading={isGenerating}
                disabled={isGenerating || isAccepting}
                style={styles.actionButton}
                textColor={colors.primary}
              >
                Regenerate all
              </Button>
              <Button
                mode="contained"
                icon="check"
                onPress={acceptPlan}
                loading={isAccepting}
                disabled={isGenerating || isAccepting}
                style={styles.actionButton}
                buttonColor={colors.primary}
                textColor={colors.white}
              >
                Accept plan
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                icon={hasGaps ? 'auto-fix' : 'refresh'}
                onPress={() => generate(hasGaps ? 'fill' : 'all')}
                loading={isGenerating}
                disabled={isGenerating || allDishes.length === 0}
                style={styles.actionButton}
                buttonColor={colors.primary}
                textColor={colors.white}
              >
                {hasGaps ? (hasSaved ? 'Generate remaining days' : 'Generate plan') : 'Regenerate plan'}
              </Button>
              {hasGaps && hasSaved && (
                <Button
                  mode="outlined"
                  icon="refresh"
                  onPress={() => generate('all')}
                  loading={isGenerating}
                  disabled={isGenerating || allDishes.length === 0}
                  style={styles.actionButton}
                  textColor={colors.primary}
                >
                  Regenerate all
                </Button>
              )}
            </>
          )}
        </View>

        {planHasHomeDish && (
          <Button
            mode="outlined"
            icon="cart-plus"
            onPress={addWeekIngredients}
            loading={addingGrocery}
            disabled={addingGrocery}
            style={styles.groceryButton}
            textColor={colors.primary}
          >
            Add this week's ingredients to grocery
          </Button>
        )}

        {plan.length === 0 && !isGenerating && !dataLoaded && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyText}>Loading your meal history...</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit dialog */}
      <Portal>
        <Dialog visible={editIndex !== null} onDismiss={() => setEditIndex(null)}>
          <Dialog.Title>Edit dish</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Dish name"
              value={editDishName}
              onChangeText={setEditDishName}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditIndex(null)}>Cancel</Button>
            <Button onPress={confirmEdit}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Celebration
        visible={celebrate}
        onDone={() => setCelebrate(false)}
        icon="party-popper"
        color={colors.primary}
      />
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },
    loadingText: { marginTop: Spacing.md, fontFamily: Fonts.body, fontSize: FontSize.lg, color: c.textSecondary },
    header: { marginBottom: Spacing.md },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
    headerTitle: { fontFamily: Fonts.display, fontSize: FontSize.xxl, color: c.text },
    weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
    weekLabel: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSize.lg,
      color: c.text,
      minWidth: 160,
      textAlign: 'center',
    },
    subtitle: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textSecondary },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: c.surfaceVariant,
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    infoText: { flex: 1, fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 18 },
    calendarBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: c.homeLight,
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    calendarBannerText: { flex: 1, fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.text, lineHeight: 18 },
    calendarBannerClose: { margin: 0, marginTop: -6, marginRight: -8 },
    kidsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    kidsToggleText: { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: FontSize.md, color: c.text },
    kidsSlotRow: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    kidsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    chip: { backgroundColor: c.surfaceVariant },
    chipText: { fontSize: FontSize.xs },
    dayRow: {
      borderRadius: BorderRadius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    dayRowToday: { borderColor: c.primary, borderWidth: 1 },
    dayRowPast: { opacity: 0.5, backgroundColor: c.surfaceVariant },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.sm },
    dayNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    // Matches CalendarScreen's day header exactly (Fraunces lg name + body sm date).
    dayName: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text },
    dayDate: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted },
    todayPill: { backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingHorizontal: 9, paddingVertical: 2 },
    todayPillText: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: c.white, textTransform: 'uppercase', letterSpacing: 0.5 },
    todayText: { color: c.primary },
    pastPill: { backgroundColor: c.textMuted, borderRadius: BorderRadius.full, paddingHorizontal: 9, paddingVertical: 2 },
    pastPillText: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: c.white, textTransform: 'uppercase', letterSpacing: 0.5 },
    refreshBtn: { margin: 0, marginVertical: -8, marginRight: -8 },
    restSub: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted, marginBottom: Spacing.xs, marginTop: -2 },
    mealRow: { flexDirection: 'row', gap: Spacing.md },
    mealSlot: { flex: 1 },
    mealTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.xs },
    srcDot: { width: 7, height: 7, borderRadius: 4 },
    mealTypeLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dishName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text, marginBottom: Spacing.xs },
    dishNameReadOnly: { color: c.textSecondary },
    dishMeta: { flexDirection: 'row', alignItems: 'center' },
    daysAgoText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs },
    newBadge: { backgroundColor: c.primary, color: c.white, fontSize: FontSize.xs, alignSelf: 'flex-start' },
    actions: { marginTop: Spacing.lg, gap: Spacing.sm },
    actionButton: { borderRadius: BorderRadius.md },
    groceryButton: { borderRadius: BorderRadius.md, marginTop: Spacing.sm, borderColor: c.primary },
    emptyState: { alignItems: 'center', marginTop: Spacing.xxl, gap: Spacing.md },
    emptyText: {
      fontFamily: Fonts.body,
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
    },
  });

export default PlanScreen;
