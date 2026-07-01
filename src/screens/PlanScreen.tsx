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
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, addDays, parseISO } from 'date-fns';
import { Colors, Spacing, FontSize, BorderRadius } from '../config/theme';
import { generateMealPlan } from '../services/planner';
import { useDishStore } from '../stores/useDishStore';
import { useMealStore } from '../stores/useMealStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';
import type { MealPlan, Meal } from '../types';
import type { MainTabScreenProps } from '../navigation/types';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function mealsToMealPlan(weekMeals: Meal[], startDate: string): MealPlan[] {
  const plan: MealPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const date = format(addDays(parseISO(startDate), i), 'yyyy-MM-dd');
    const dayMeals = weekMeals.filter((m) => m.date === date);
    const lunch = dayMeals.find((m) => m.mealType === 'lunch');
    const dinner = dayMeals.find((m) => m.mealType === 'dinner');
    if (!lunch && !dinner) continue;
    plan.push({
      date,
      lunch: {
        dishName: lunch?.dishName ?? '',
        sourceType: lunch?.sourceType ?? 'home',
        isNew: false,
        lastMadeDaysAgo: 0,
      },
      dinner: {
        dishName: dinner?.dishName ?? '',
        sourceType: dinner?.sourceType ?? 'home',
        isNew: false,
        lastMadeDaysAgo: 0,
      },
    });
  }
  return plan;
}

export const PlanScreen: React.FC<MainTabScreenProps<'Plan'>> = ({ navigation }) => {
  const { dishes, fetchDishes } = useDishStore();
  const { meals, addMeal, fetchAllMeals } = useMealStore();
  const { preferences, household } = useHouseholdStore();
  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';

  const [plan, setPlan] = useState<MealPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isPlanFromCalendar, setIsPlanFromCalendar] = useState(false);
  const [editIndex, setEditIndex] = useState<{ dayIdx: number; slot: 'lunch' | 'dinner' } | null>(null);
  const [editDishName, setEditDishName] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  const [weekOffset, setWeekOffset] = useState(0);
  const startDate = format(addDays(new Date(), 1 + weekOffset * 7), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), 7 + weekOffset * 7), 'yyyy-MM-dd');
  const dateRangeLabel = `${format(addDays(new Date(), 1 + weekOffset * 7), 'MMM d')} – ${format(addDays(new Date(), 7 + weekOffset * 7), 'MMM d')}`;

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
    ]).then(() => setDataLoaded(true));
  }, [householdId]);

  // When week changes, clear plan so we can reload
  useEffect(() => {
    setPlan([]);
    setIsPlanFromCalendar(false);
  }, [weekOffset]);

  // After data loads or week changes, check if this week already has saved meals
  useEffect(() => {
    if (!dataLoaded || plan.length > 0) return;
    const weekMeals = meals.filter((m) => m.date >= startDate && m.date <= endDate);
    if (weekMeals.length > 0) {
      const existingPlan = mealsToMealPlan(weekMeals, startDate);
      if (existingPlan.length > 0) {
        setPlan(existingPlan);
        setIsPlanFromCalendar(true);
      }
    }
  }, [dataLoaded, meals, startDate, endDate]);

  useEffect(() => {
    if (plan.length === 0 || isPlanFromCalendar) return;
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
  }, [navigation, plan.length, isPlanFromCalendar]);

  const allDishes = useMemo(() => {
    const dishMap = new Map<string, typeof dishes[0]>();
    dishes.forEach((d) => dishMap.set(d.name.toLowerCase(), d));
    meals.forEach((m) => {
      if (m.dishName && !dishMap.has(m.dishName.toLowerCase())) {
        dishMap.set(m.dishName.toLowerCase(), {
          id: m.dishName,
          name: m.dishName,
          cuisineTag: m.cuisineTag || 'Other',
          categoryTags: [],
          isFavorite: false,
          timesCooked: 1,
          lastCookedDate: m.date,
        });
      }
    });
    return Array.from(dishMap.values());
  }, [dishes, meals]);

  const generate = useCallback(() => {
    if (allDishes.length === 0) {
      Alert.alert('No dishes yet', 'Add some meals first so ThaliPlan can learn your preferences and generate a plan.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = generateMealPlan(
        allDishes,
        meals,
        defaultPrefs,
        startDate,
        7,
      );
      setPlan(result);
      setIsPlanFromCalendar(false);
    } finally {
      setIsGenerating(false);
    }
  }, [allDishes, meals, defaultPrefs, startDate]);

  const refreshDay = useCallback(
    (dayIdx: number) => {
      if (allDishes.length === 0) return;
      const dayPlan = generateMealPlan(
        allDishes,
        meals,
        defaultPrefs,
        plan[dayIdx].date,
        1,
      );
      setPlan((prev) => prev.map((p, i) => (i === dayIdx ? dayPlan[0] : p)));
      setIsPlanFromCalendar(false);
    },
    [allDishes, meals, defaultPrefs, plan],
  );

  const openEdit = (dayIdx: number, slot: 'lunch' | 'dinner') => {
    if (isPlanFromCalendar) return; // calendar plan is read-only until regenerated
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

  const acceptPlan = useCallback(async () => {
    if (!householdId || !user) {
      Alert.alert('Error', 'No household set up. Please set up your household first.');
      return;
    }
    setIsAccepting(true);
    try {
      for (const day of plan) {
        if (day.lunch.dishName) {
          const matchedDish = allDishes.find((d) => d.name === day.lunch.dishName);
          // Check for existing meal in this slot and update instead of add
          const existingLunch = meals.find((m) => m.date === day.date && m.mealType === 'lunch');
          if (existingLunch) {
            const { updateMeal } = useMealStore.getState();
            await updateMeal(householdId, existingLunch.id, {
              dishName: day.lunch.dishName,
              sourceType: day.lunch.sourceType,
              cuisineTag: matchedDish?.cuisineTag || 'Other',
            });
          } else {
            await addMeal(householdId, {
              date: day.date,
              mealType: 'lunch',
              sourceType: day.lunch.sourceType,
              dishName: day.lunch.dishName,
              cuisineTag: matchedDish?.cuisineTag || 'Other',
              createdBy: user.id,
              householdId,
            });
          }
        }
        if (day.dinner.dishName) {
          const matchedDish = allDishes.find((d) => d.name === day.dinner.dishName);
          const existingDinner = meals.find((m) => m.date === day.date && m.mealType === 'dinner');
          if (existingDinner) {
            const { updateMeal } = useMealStore.getState();
            await updateMeal(householdId, existingDinner.id, {
              dishName: day.dinner.dishName,
              sourceType: day.dinner.sourceType,
              cuisineTag: matchedDish?.cuisineTag || 'Other',
            });
          } else {
            await addMeal(householdId, {
              date: day.date,
              mealType: 'dinner',
              sourceType: day.dinner.sourceType,
              dishName: day.dinner.dishName,
              cuisineTag: matchedDish?.cuisineTag || 'Other',
              createdBy: user.id,
              householdId,
            });
          }
        }
      }
      setPlan([]);
      setIsPlanFromCalendar(false);
      Alert.alert('Plan saved!', 'Your meal plan has been added to the calendar.', [
        { text: 'View Calendar', onPress: () => navigation.navigate('Calendar' as any) },
        { text: 'OK' },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save plan.');
    } finally {
      setIsAccepting(false);
    }
  }, [plan, householdId, user, allDishes, meals, addMeal, navigation]);

  const daysAgoColor = (days: number) => {
    if (days > 60) return Colors.error;
    if (days < 30) return Colors.success;
    return Colors.textSecondary;
  };

  if (isGenerating && plan.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Generating your meal plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="auto-fix" size={28} color={Colors.primary} />
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
            {isPlanFromCalendar
              ? 'Showing saved plan — tap Regenerate to create a new one'
              : plan.length > 0
              ? 'Review and accept your plan'
              : 'No plan yet for this week'}
          </Text>
        </View>

        {/* Info banner — only show when not from calendar */}
        {!isPlanFromCalendar && (
          <Surface style={styles.infoBanner} elevation={1}>
            <MaterialCommunityIcons name="information-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              This plan avoids dishes you made in the last {defaultPrefs.avoidRepeatDays} days,
              mixes cuisines, and reserves weekend dinners for dining out.
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

        {/* Saved plan indicator */}
        {isPlanFromCalendar && plan.length > 0 && (
          <Surface style={styles.calendarBanner} elevation={1}>
            <MaterialCommunityIcons name="calendar-check" size={20} color={Colors.home} />
            <Text style={styles.calendarBannerText}>
              This week's plan is already saved. Edit individual entries in the Calendar tab, or regenerate a completely new plan below.
            </Text>
          </Surface>
        )}

        {/* Plan list */}
        {plan.map((day, idx) => {
          const date = parseISO(day.date);
          const dayLabel = `${DAY_LABELS[date.getDay()]} ${format(date, 'd')}`;
          return (
            <Surface key={day.date} style={styles.dayRow} elevation={1}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{dayLabel}</Text>
                {!isPlanFromCalendar && (
                  <IconButton
                    icon="refresh"
                    size={18}
                    iconColor={Colors.textSecondary}
                    onPress={() => refreshDay(idx)}
                  />
                )}
              </View>
              <View style={styles.mealRow}>
                {/* Lunch */}
                <View style={styles.mealSlot}>
                  <Text style={styles.mealTypeLabel}>Lunch</Text>
                  <Text
                    style={[styles.dishName, isPlanFromCalendar && styles.dishNameReadOnly]}
                    onPress={() => openEdit(idx, 'lunch')}
                    numberOfLines={1}
                  >
                    {day.lunch.dishName || '—'}
                  </Text>
                  {!isPlanFromCalendar && (
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
                  <Text style={styles.mealTypeLabel}>Dinner</Text>
                  <Text
                    style={[styles.dishName, isPlanFromCalendar && styles.dishNameReadOnly]}
                    onPress={() => openEdit(idx, 'dinner')}
                    numberOfLines={1}
                  >
                    {day.dinner.dishName || '—'}
                  </Text>
                  {!isPlanFromCalendar && (
                    <View style={styles.dishMeta}>
                      {day.dinner.isNew ? (
                        <Badge style={styles.newBadge} size={18}>New!</Badge>
                      ) : day.dinner.sourceType !== 'dineout' && day.dinner.dishName ? (
                        <Text style={[styles.daysAgoText, { color: daysAgoColor(day.dinner.lastMadeDaysAgo) }]}>
                          {day.dinner.lastMadeDaysAgo}d ago
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>
            </Surface>
          );
        })}

        {/* Action buttons */}
        <View style={styles.actions}>
          {isPlanFromCalendar ? (
            <Button
              mode="outlined"
              icon="refresh"
              onPress={generate}
              loading={isGenerating}
              disabled={isGenerating || isAccepting}
              style={styles.actionButton}
              textColor={Colors.primary}
            >
              Regenerate plan
            </Button>
          ) : plan.length > 0 ? (
            <>
              <Button
                mode="outlined"
                icon="refresh"
                onPress={generate}
                loading={isGenerating}
                disabled={isGenerating || isAccepting}
                style={styles.actionButton}
                textColor={Colors.primary}
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
                buttonColor={Colors.primary}
                textColor={Colors.white}
              >
                Accept plan
              </Button>
            </>
          ) : (
            <Button
              mode="contained"
              icon="auto-fix"
              onPress={generate}
              loading={isGenerating}
              disabled={isGenerating || allDishes.length === 0}
              style={styles.actionButton}
              buttonColor={Colors.primary}
              textColor={Colors.white}
            >
              Generate plan
            </Button>
          )}
        </View>

        {plan.length === 0 && !isGenerating && !dataLoaded && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={Colors.primary} />
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
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditIndex(null)}>Cancel</Button>
            <Button onPress={confirmEdit}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  weekLabel: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 160,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  calendarBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.homeLight ?? Colors.surfaceVariant,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  calendarBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.surfaceVariant,
  },
  chipText: {
    fontSize: FontSize.xs,
  },
  dayRow: {
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  mealRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  mealSlot: {
    flex: 1,
  },
  mealTypeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  dishName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  dishNameReadOnly: {
    color: Colors.textSecondary,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysAgoText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  newBadge: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: FontSize.xs,
    alignSelf: 'flex-start',
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    borderRadius: BorderRadius.md,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

export default PlanScreen;
