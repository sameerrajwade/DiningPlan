import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { MealTypeToggle } from '../components/MealTypeToggle';
import { SourceTypeToggle } from '../components/SourceTypeToggle';
import { DishPicker } from '../components/DishPicker';
import { DishSuggestInput } from '../components/DishSuggestInput';
import { CuisineChips } from '../components/CuisineChips';
import { AudienceToggle } from '../components/AudienceToggle';
import { StarRating } from '../components/StarRating';
import { useAuthStore } from '../stores/useAuthStore';
import { useMealStore } from '../stores/useMealStore';
import { useDishStore } from '../stores/useDishStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { getCurrencySymbol } from '../utils/currency';
import { setRestaurantDishRating } from '../services/firestore';
import type { RootStackScreenProps } from '../navigation/types';
import type { Meal, MealType, SourceType, CuisineTag, MealItem, MealAudience, Diet, Dish } from '../types';
import { toTitleCase } from '../utils/text';
import { inferDietFromNames } from '../utils/diet';
import { matchCatalogDish } from '../utils/starterDishes';
import { parseRecipeInput } from '../utils/recipe';
import { VegMark } from '../components/VegMark';

type Props = RootStackScreenProps<'AddMeal'>;

// Pick a sensible starting meal type by time of day, but only among the meal
// types the household has ENABLED — so a disabled Breakfast/Snack is never
// auto-selected (which previously created stray breakfast meals).
function getDefaultMealType(enabled?: MealType[]): MealType {
  const allowed = enabled && enabled.length ? enabled : (['lunch', 'dinner'] as MealType[]);
  const hour = new Date().getHours();
  const byTime: MealType = hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 17 ? 'snack' : 'dinner';
  if (allowed.includes(byTime)) return byTime;
  if (allowed.includes('lunch')) return 'lunch';
  if (allowed.includes('dinner')) return 'dinner';
  return allowed[0];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AddMealScreen: React.FC<Props> = ({ route, navigation }) => {
  const existingMeal = route.params?.meal;
  const isEditing = !!(existingMeal && existingMeal.id);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';
  const { addMeal, updateMeal, deleteMeal } = useMealStore();
  const [isSaving, setIsSaving] = useState(false);
  const { dishes, fetchDishes, addDish, updateDish } = useDishStore();
  const { preferences } = useHouseholdStore();

  const currencySymbol = getCurrencySymbol(preferences?.currency ?? 'USD');

  const [date, setDate] = useState(
    existingMeal?.date ?? format(new Date(), 'yyyy-MM-dd'),
  );
  const [mealType, setMealType] = useState<MealType>(
    // Honor the slot the user tapped on Home (route param) before falling back
    // to the household's default — otherwise tapping "Dinner" opens on "Lunch".
    existingMeal?.mealType ?? route.params?.mealType ?? getDefaultMealType(preferences?.defaultMeals),
  );
  const [sourceType, setSourceType] = useState<SourceType>(
    existingMeal?.sourceType ?? 'home',
  );
  const [dishName, setDishName] = useState(existingMeal?.dishName ?? '');
  const [audience, setAudience] = useState<MealAudience>(existingMeal?.audience ?? 'family');
  // Extra dishes for a home meal (a thali: curry + bread + rice + dal). The main
  // dish is `dishName`; these are the accompaniments. Stored together in `items`.
  const [sides, setSides] = useState<string[]>(() =>
    existingMeal?.sourceType === 'home' && existingMeal.items && existingMeal.items.length > 1
      ? existingMeal.items.slice(1).map((i) => i.name)
      : [],
  );
  // Dishes ordered at a restaurant (dine-out / takeout), each with a star rating.
  const [items, setItems] = useState<MealItem[]>(() => {
    if (existingMeal?.items?.length) return existingMeal.items.map((i) => ({ ...i }));
    if (existingMeal?.dishName) return [{ name: existingMeal.dishName }];
    return [{ name: '' }];
  });
  const [cuisineTag, setCuisineTag] = useState<CuisineTag>(
    existingMeal?.cuisineTag ?? 'Indian',
  );
  const [restaurantName, setRestaurantName] = useState(
    existingMeal?.restaurantName ?? '',
  );
  const [cost, setCost] = useState(
    existingMeal?.cost !== undefined ? String(existingMeal.cost) : '',
  );
  const [notes, setNotes] = useState(existingMeal?.notes ?? '');
  // Optional ingredients for the MAIN dish (kept on the dish, not the meal, so
  // logging stays fast). Collapsed by default; prefilled from an existing dish or
  // the global catalog if we recognize the name. Never blocks saving.
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingExpanded, setIngExpanded] = useState(false);
  const [ingDraft, setIngDraft] = useState('');
  const [ingTouched, setIngTouched] = useState(false);
  // Optional recipe (link or typed steps) for the main dish — lives in the same
  // collapsible section as ingredients. Prefilled from a recognized dish.
  const [recipeDraft, setRecipeDraft] = useState('');
  const [recipeTouched, setRecipeTouched] = useState(false);
  // Veg / Non-veg mark. Auto-inferred from the dish names as the user types, but
  // once they tap the toggle their choice sticks (dietTouched) and we stop
  // auto-following. Editing an old meal that has no stored diet stays auto.
  const [diet, setDiet] = useState<Diet>(existingMeal?.diet ?? 'veg');
  const [dietTouched, setDietTouched] = useState<boolean>(!!existingMeal?.diet);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => {
    const d = date ? new Date(date + 'T00:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const { meals: allMeals } = useMealStore();

  useEffect(() => {
    if (householdId) fetchDishes(householdId);
  }, [householdId, fetchDishes]);

  // The modal already shows a header — set its title (edit vs add) and drop the
  // old in-content hero heading so "Add meal" isn't duplicated (and ~20% of the
  // screen isn't wasted on a second title).
  useEffect(() => {
    navigation.setOptions({ headerTitle: isEditing ? 'Edit meal' : 'Add meal' });
  }, [navigation, isEditing]);

  const allKnownDishes = useMemo(() => {
    const dishMap = new Map<string, typeof dishes[0]>();
    dishes.forEach((d) => dishMap.set(d.name.toLowerCase(), d));
    allMeals.forEach((m) => {
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
  }, [dishes, allMeals]);

  // Plain name list powering the as-you-type suggestions on the additional-dish
  // rows (both home "more dishes" and restaurant "dishes ordered").
  const dishNameSuggestions = useMemo(
    () => allKnownDishes.map((d) => d.name),
    [allKnownDishes],
  );

  // Prefill the optional ingredient list from an existing dish, else the global
  // catalog, whenever the main dish name changes — UNLESS the user has already
  // edited the list themselves (ingTouched). "If ingredients exist, just show
  // them; if not, let them add." Never runs for outside meals.
  useEffect(() => {
    if (ingTouched) return;
    const name = dishName.trim();
    if (!name) {
      setIngredients([]);
      return;
    }
    const existing = dishes.find((d) => d.name.toLowerCase() === name.toLowerCase());
    if (existing?.ingredients?.length) {
      setIngredients(existing.ingredients);
      return;
    }
    const match = matchCatalogDish(name);
    setIngredients(match?.ingredients ?? []);
  }, [dishName, dishes, ingTouched]);

  // Prefill the recipe from a recognized dish (catalog dishes ship no recipe).
  useEffect(() => {
    if (recipeTouched) return;
    const name = dishName.trim();
    if (!name) { setRecipeDraft(''); return; }
    const existing = dishes.find((d) => d.name.toLowerCase() === name.toLowerCase());
    setRecipeDraft(existing?.recipe?.value ?? '');
  }, [dishName, dishes, recipeTouched]);

  const addIngredient = () => {
    const text = ingDraft.trim().toLowerCase();
    if (!text) return;
    setIngredients((prev) => (prev.includes(text) ? prev : [...prev, text]));
    setIngTouched(true);
    setIngDraft('');
  };
  const removeIngredient = (name: string) => {
    setIngredients((prev) => prev.filter((i) => i !== name));
    setIngTouched(true);
  };

  // Auto-set the veg/non-veg mark from whatever dishes are currently entered
  // (home: main + sides; outside: dishes ordered) until the user overrides it.
  const dietNames = useMemo(
    () => (sourceType === 'home' ? [dishName, ...sides] : items.map((i) => i.name)),
    [sourceType, dishName, sides, items],
  );
  useEffect(() => {
    if (dietTouched) return;
    setDiet(inferDietFromNames(dietNames));
  }, [dietNames, dietTouched]);

  // Track which newly-added row should grab focus. autoFocus only fires at
  // mount, so we set this to the incoming index BEFORE appending the row.
  const [focusSideIdx, setFocusSideIdx] = useState<number | null>(null);
  const [focusItemIdx, setFocusItemIdx] = useState<number | null>(null);

  const recentDishNames = useMemo(() => {
    return allKnownDishes
      .filter((d) => d.lastCookedDate)
      .sort(
        (a, b) =>
          new Date(b.lastCookedDate).getTime() -
          new Date(a.lastCookedDate).getTime(),
      )
      .slice(0, 8)
      .map((d) => d.name);
  }, [allKnownDishes]);

  const handleSelectDish = useCallback(
    (name: string) => {
      setDishName(name);
      const dish = allKnownDishes.find((d) => d.name === name);
      if (dish) {
        setCuisineTag(dish.cuisineTag);
        return;
      }
      // Not one of the household's own dishes yet — fall back to the global
      // catalog so a correctly-typed dish still pre-fills its cuisine. Purely a
      // convenience default; the user can override, and logging is never gated.
      const match = matchCatalogDish(name);
      if (match) setCuisineTag(match.cuisineTag);
    },
    [allKnownDishes],
  );

  const setItemName = useCallback((idx: number, name: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, name } : it)));
  }, []);
  const setItemRating = useCallback((idx: number, rating: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, rating: it.rating === rating ? undefined : rating } : it)),
    );
  }, []);
  const addItemRow = useCallback(() => {
    setFocusItemIdx(items.length); // new row lands at the current length
    setItems((prev) => [...prev, { name: '' }]);
  }, [items.length]);
  const removeItemRow = useCallback((idx: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }, []);

  const setSide = useCallback((idx: number, name: string) => {
    setSides((prev) => prev.map((s, i) => (i === idx ? name : s)));
  }, []);
  const addSide = useCallback(() => {
    setFocusSideIdx(sides.length); // new row lands at the current length
    setSides((prev) => [...prev, '']);
  }, [sides.length]);
  const removeSide = useCallback((idx: number) => {
    setSides((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Date picker calendar data
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(pickerMonth);
    const monthEnd = endOfMonth(pickerMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDow = getDay(monthStart);
    const blanks: (Date | null)[] = Array(startDow).fill(null);
    return [...blanks, ...days];
  }, [pickerMonth]);

  const handleDateSelect = useCallback((d: Date) => {
    setDate(format(d, 'yyyy-MM-dd'));
    setShowDatePicker(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!householdId) {
      Alert.alert('Error', 'No household set up.');
      return;
    }

    const isOutside = sourceType === 'takeout' || sourceType === 'dineout';

    // Dish name is required for home meals, but optional for takeout/dine-out
    // (you may just be logging a restaurant visit).
    if (!isOutside && !dishName.trim()) {
      Alert.alert('Validation', 'Dish name is required.');
      return;
    }
    if (isOutside && !restaurantName.trim()) {
      Alert.alert('Validation', 'Restaurant name is required for takeout and dine-out meals.');
      return;
    }

    setIsSaving(true);
    try {
      // For outside meals, collect the multiple dishes ordered (each may carry a
      // star rating). For home meals, the single dish field is authoritative.
      const cleanItems: MealItem[] = isOutside
        ? items
            .map((it) => {
              const name = toTitleCase(it.name.trim());
              // Only attach `rating` when actually set — an `undefined` rating
              // would make Firestore reject the whole meal write.
              return (it.rating != null ? { name, rating: it.rating } : { name }) as MealItem;
            })
            .filter((it) => it.name.length > 0)
        : [];

      // Home meals: main dish + optional sides (a thali). Stored in `items`.
      const homeItems: MealItem[] = !isOutside
        ? [dishName, ...sides]
            .map((n) => ({ name: toTitleCase(n.trim()) }))
            .filter((it) => it.name.length > 0)
        : [];

      // Fall back to the restaurant name when no dish was entered for an
      // outside meal, so history/insights still have something to show.
      const resolvedDishName = isOutside
        ? cleanItems[0]?.name || restaurantName.trim()
        : toTitleCase(dishName.trim());

      // Guard against a NaN cost from free-text like "." — a NaN would sail past
      // stripUndefined (Firestore accepts NaN doubles) and poison spend aggregates
      // + the restaurant's totalSpend via increment().
      const parsedCost = parseFloat(cost);
      const safeCost = isOutside && Number.isFinite(parsedCost) ? parsedCost : 0;

      const mealData: Omit<Meal, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'householdId'> = {
        date,
        mealType,
        sourceType,
        dishName: resolvedDishName,
        cuisineTag,
        restaurantName: isOutside ? restaurantName.trim() : '',
        cost: safeCost,
        notes: notes.trim() || '',
        audience,
        diet,
        // ALWAYS write `items` (never omit the key). updateMeal is a merge, so
        // omitting it on edit left the OLD array intact — a cleared dish or a
        // home→outside switch kept showing stale dishes. An empty array cleanly
        // clears it; screens read via `items?.length` so [] is safe.
        items: isOutside ? cleanItems : homeItems,
      };

      // Persist per-dish star ratings onto the restaurant ("what to take/avoid").
      if (isOutside && restaurantName.trim()) {
        const rest = restaurantName.trim();
        await Promise.all(
          cleanItems
            .filter((it) => it.rating)
            .map((it) => setRestaurantDishRating(householdId, rest, it.name, it.rating!).catch(() => {})),
        );
      }

      if (isEditing && existingMeal) {
        await updateMeal(householdId, existingMeal.id, mealData);
      } else {
        // Check for duplicate meal (same date + type + audience — family and
        // kids can each have their own entry in the same slot).
        const existingForSlot = useMealStore.getState().meals.find(
          (m) => m.date === date && m.mealType === mealType && (m.audience ?? 'family') === audience,
        );
        if (existingForSlot) {
          await new Promise<void>((resolve, reject) => {
            Alert.alert(
              'Meal Already Exists',
              `A ${mealType} is already logged for this date. Do you want to replace it?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('cancelled')) },
                {
                  text: 'Replace',
                  onPress: async () => {
                    try {
                      await updateMeal(householdId, existingForSlot.id, mealData);
                      resolve();
                    } catch (e) {
                      reject(e);
                    }
                  },
                },
              ],
            );
          });
        } else {
          await addMeal(householdId, {
            ...mealData,
            createdBy: user?.id ?? '',
            householdId,
          });
        }
      }

      // Optionally persist the main dish's ingredients + recipe (kept on the DISH,
      // not the meal). Only for home meals; never blocks the meal save.
      if (!isOutside) {
        const existing = dishes.find(
          (d) => d.name.toLowerCase() === resolvedDishName.toLowerCase(),
        );
        const parsedRecipe = parseRecipeInput(recipeDraft);
        // ingredients: save when the user edited them, or to persist a
        // catalog-prefilled list onto a bare dish. recipe: only when the user
        // touched the field (parse null = they cleared it → remove).
        const ingChanged =
          ingredients.length > 0 && (ingTouched || !existing?.ingredients?.length);
        const patch: Partial<Dish> = {};
        if (ingChanged) patch.ingredients = ingredients;
        if (recipeTouched) patch.recipe = parsedRecipe ?? (null as any);
        if (Object.keys(patch).length > 0) {
          try {
            if (existing) {
              await updateDish(householdId, existing.id, patch);
            } else {
              await addDish(householdId, {
                name: resolvedDishName,
                cuisineTag,
                categoryTags: [],
                isFavorite: false,
                timesCooked: 0,
                lastCookedDate: '',
                householdId,
                ...(patch.ingredients ? { ingredients: patch.ingredients } : {}),
                ...(patch.recipe ? { recipe: patch.recipe } : {}),
              });
            }
          } catch {
            // Non-critical — the meal already saved.
          }
        }
      }
      navigation.goBack();
    } catch (e: any) {
      if (e.message !== 'cancelled') {
        Alert.alert('Error', e.message ?? 'Failed to save meal.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    dishName, householdId, isEditing, existingMeal, date, mealType,
    sourceType, cuisineTag, restaurantName, cost, notes, user,
    items, sides, audience, diet, addMeal, updateMeal, navigation,
    // Without these the callback captured a STALE closure — ingredients/recipe
    // typed after mount were never persisted (the "didn't save" bug).
    ingredients, ingTouched, recipeDraft, recipeTouched, dishes, addDish, updateDish,
  ]);

  const handleDelete = useCallback(() => {
    if (!existingMeal || !householdId) return;
    Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal(householdId, existingMeal.id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to delete meal.');
          }
        },
      },
    ]);
  }, [existingMeal, householdId, deleteMeal, navigation]);

  const formattedDate = useMemo(() => {
    if (!date) return 'Select date';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, [date]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          accessibilityLabel="Select date"
        >
          <Text style={styles.dateButtonText}>{formattedDate}</Text>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}>
                  <Text style={styles.pickerNav}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>
                  {format(pickerMonth, 'MMMM yyyy')}
                </Text>
                <TouchableOpacity onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}>
                  <Text style={styles.pickerNav}>{'>'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dayNamesRow}>
                {DAY_NAMES.map((d) => (
                  <Text key={d} style={styles.dayNameText}>{d}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, i) => {
                  if (!day) {
                    return <View key={`blank-${i}`} style={styles.calendarCell} />;
                  }
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isSelected = dayStr === date;
                  return (
                    <TouchableOpacity
                      key={dayStr}
                      style={[styles.calendarCell, isSelected && styles.calendarCellSelected]}
                      onPress={() => handleDateSelect(day)}
                    >
                      <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
                        {day.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Button mode="text" onPress={() => setShowDatePicker(false)} textColor={colors.textSecondary}>
                Cancel
              </Button>
            </View>
          </View>
        </Modal>

        {/* Audience — family or kids tiffin */}
        <Text style={styles.label}>For</Text>
        <AudienceToggle selected={audience} onSelect={setAudience} />

        {/* Meal Type */}
        <Text style={[styles.label, { marginTop: Spacing.md }]}>Meal Type</Text>
        <MealTypeToggle selected={mealType} onSelect={setMealType} allowed={preferences?.defaultMeals} />

        {/* Source Type */}
        <Text style={[styles.label, { marginTop: Spacing.md }]}>Source</Text>
        <SourceTypeToggle selected={sourceType} onSelect={setSourceType} />

        {/* Veg / Non-veg — auto-set from the dish names, tap to override */}
        <Text style={[styles.label, { marginTop: Spacing.md }]}>Veg / Non-veg</Text>
        <View style={styles.dietRow}>
          {(['veg', 'nonveg'] as Diet[]).map((d) => {
            const active = diet === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dietOption, active && styles.dietOptionActive]}
                onPress={() => { setDiet(d); setDietTouched(true); }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={d === 'veg' ? 'Vegetarian' : 'Non-vegetarian'}
              >
                <VegMark diet={d} size={16} />
                <Text style={[styles.dietText, active && styles.dietTextActive]}>
                  {d === 'veg' ? 'Veg' : 'Non-veg'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dish Name — single field for home; outside meals use the multi-dish
            editor inside the restaurant block below. */}
        {sourceType === 'home' && (
          <>
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Main dish</Text>
            <DishPicker
              value={dishName}
              onChangeText={setDishName}
              dishes={allKnownDishes}
              recentDishes={recentDishNames}
              onSelectDish={handleSelectDish}
            />

            {/* Additional dishes in the same meal — a full thali (curry + bread +
                rice + dal). Labeled + icon'd so they read as dishes, not notes. */}
            {sides.length > 0 && (
              <Text style={[styles.label, { marginTop: Spacing.sm }]}>More dishes in this meal</Text>
            )}
            {sides.map((s, idx) => (
              <View key={idx} style={styles.sideRow}>
                <DishSuggestInput
                  value={s}
                  onChangeText={(t) => setSide(idx, t)}
                  suggestions={dishNameSuggestions}
                  autoFocus={focusSideIdx === idx}
                  style={styles.sideInput}
                  left={<TextInput.Icon icon="silverware-variant" color={colors.textMuted} />}
                  placeholder={`Dish ${idx + 2} (e.g. Rice, Roti, Dal)`}
                  accessibilityLabel={`Dish ${idx + 2}`}
                />
                <TouchableOpacity
                  onPress={() => removeSide(idx)}
                  style={styles.dishItemRemove}
                  accessibilityLabel={`Remove dish ${idx + 2}`}
                >
                  <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addSide} style={styles.addDishRow} accessibilityLabel="Add another dish to this meal">
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addDishText}>Add another dish</Text>
            </TouchableOpacity>

            {/* Ingredients + recipe — placed AFTER all the dishes (adding dishes is
                the priority), just before Cuisine. Collapsible + optional; applies
                to the MAIN dish. Never gates the 10-second log. */}
            {dishName.trim().length > 0 && (
              <View style={styles.ingSection}>
                <TouchableOpacity
                  style={styles.ingHeader}
                  onPress={() => setIngExpanded((v) => !v)}
                  accessibilityLabel="Toggle ingredients and recipe"
                >
                  <MaterialCommunityIcons name="basket-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.ingHeaderText}>
                    Ingredients & recipe{' '}
                    <Text style={styles.ingHeaderHint}>
                      (optional{ingredients.length ? ` · ${ingredients.length}` : ''})
                    </Text>
                  </Text>
                  <MaterialCommunityIcons
                    name={ingExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
                {ingExpanded && (
                  <View style={styles.ingBody}>
                    {ingredients.length > 0 && (
                      <View style={styles.ingChips}>
                        {ingredients.map((ing) => (
                          <Chip
                            key={ing}
                            onClose={() => removeIngredient(ing)}
                            style={styles.ingChip}
                            textStyle={styles.ingChipText}
                          >
                            {toTitleCase(ing)}
                          </Chip>
                        ))}
                      </View>
                    )}
                    <View style={styles.ingAddRow}>
                      <TextInput
                        value={ingDraft}
                        onChangeText={setIngDraft}
                        placeholder="Add an ingredient"
                        mode="outlined"
                        dense
                        style={styles.ingInput}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                        onSubmitEditing={addIngredient}
                        returnKeyType="done"
                      />
                      <TouchableOpacity onPress={addIngredient} disabled={!ingDraft.trim()}>
                        <MaterialCommunityIcons
                          name="plus-circle"
                          size={28}
                          color={ingDraft.trim() ? colors.primary : colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.ingRecipeLabel}>Recipe (link or steps)</Text>
                    <TextInput
                      value={recipeDraft}
                      onChangeText={(t) => { setRecipeDraft(t); setRecipeTouched(true); }}
                      placeholder="Paste a YouTube / recipe link, or type how you make it"
                      mode="outlined"
                      multiline
                      style={styles.ingRecipeInput}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                    <Text style={styles.ingNote}>
                      Saved to this dish. Use the Grocery tab or the dish’s “Add to grocery”
                      to shop.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Cuisine */}
        <Text style={[styles.label, { marginTop: Spacing.md }]}>Cuisine</Text>
        <CuisineChips selected={cuisineTag} onSelect={setCuisineTag} />

        {/* Restaurant & Cost - only shown for outside meals */}
        {sourceType !== 'home' && (
          <>
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Restaurant / Source</Text>
            <TextInput
              value={restaurantName}
              onChangeText={setRestaurantName}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              placeholder="Restaurant name"
              accessibilityLabel="Restaurant name"
            />

            {/* Dishes ordered — multiple, each with an optional star rating */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Dishes ordered (optional)</Text>
            {items.map((it, idx) => (
              <View key={idx} style={styles.dishItemRow}>
                <View style={styles.dishItemMain}>
                  <DishSuggestInput
                    value={it.name}
                    onChangeText={(t) => setItemName(idx, t)}
                    suggestions={dishNameSuggestions}
                    autoFocus={focusItemIdx === idx}
                    style={styles.dishItemInput}
                    placeholder={`Dish ${idx + 1}`}
                    accessibilityLabel={`Dish ${idx + 1} name`}
                  />
                  {items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeItemRow(idx)}
                      style={styles.dishItemRemove}
                      accessibilityLabel={`Remove dish ${idx + 1}`}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                <StarRating
                  rating={it.rating}
                  onRate={(n) => setItemRating(idx, n)}
                  size={20}
                />
              </View>
            ))}
            <TouchableOpacity onPress={addItemRow} style={styles.addDishRow} accessibilityLabel="Add another dish">
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addDishText}>Add another dish</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Cost</Text>
            <TextInput
              value={cost}
              // decimal-pad is only a hint on Android — some keyboards (and paste)
              // still inject letters. Strip anything non-numeric and collapse any
              // extra decimal points so the field can never hold junk.
              onChangeText={(t) =>
                setCost(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))
              }
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              placeholder="0.00"
              keyboardType="decimal-pad"
              left={<TextInput.Affix text={currencySymbol} />}
              accessibilityLabel="Cost"
            />
          </>
        )}

        {/* Notes */}
        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={[styles.input, styles.notesInput]}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          placeholder="Optional notes..."
          multiline
          numberOfLines={3}
          accessibilityLabel="Notes"
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            buttonColor={colors.primary}
            textColor={colors.white}
            style={styles.saveButton}
            contentStyle={styles.buttonContent}
          >
            {isEditing ? 'Update Meal' : 'Save Meal'}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            style={styles.cancelButton}
            textColor={colors.textSecondary}
          >
            Cancel
          </Button>

          {isEditing && (
            <Button
              mode="text"
              onPress={handleDelete}
              disabled={isSaving}
              textColor={colors.error}
              style={styles.deleteButton}
            >
              Delete Meal
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xxl,
    },
    heading: {
      fontFamily: Fonts.display,
      fontSize: FontSize.xxl,
      color: c.text,
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodySemiBold,
      color: c.textSecondary,
      marginBottom: Spacing.xs,
      marginTop: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: c.surface,
      marginBottom: Spacing.xs,
    },
    notesInput: {
      minHeight: 80,
    },
    dishItemRow: {
      marginBottom: Spacing.sm,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.sm,
    },
    sideRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
    sideInput: { flex: 1, backgroundColor: c.surface },
    dishItemMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    dishItemInput: { flex: 1, backgroundColor: c.surface },
    dishItemRemove: { padding: Spacing.xs },
    addDishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    addDishText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.primary },
    ingSection: {
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: BorderRadius.md,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    ingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    ingHeaderText: { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.text },
    ingHeaderHint: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted },
    ingBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
    ingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
    ingChip: { backgroundColor: c.surfaceVariant },
    ingChipText: { fontSize: FontSize.sm, fontFamily: Fonts.body, color: c.text },
    ingAddRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    ingInput: { flex: 1, backgroundColor: c.background },
    ingRecipeLabel: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs },
    ingRecipeInput: { backgroundColor: c.background, maxHeight: 140 },
    ingNote: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.xs },
    // Matches MealTypeToggle / SourceTypeToggle so all the selectors are the
    // same height and shape.
    dietRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xs },
    dietOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceVariant,
    },
    dietOptionActive: { borderColor: c.primary, backgroundColor: c.primary },
    dietText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.textSecondary },
    dietTextActive: { color: c.white },
    dateButton: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
    },
    dateButtonText: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      width: 320,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    pickerNav: {
      fontSize: FontSize.xl,
      fontFamily: Fonts.bodySemiBold,
      color: c.primary,
      paddingHorizontal: Spacing.md,
    },
    pickerTitle: {
      fontSize: FontSize.lg,
      fontFamily: Fonts.display,
      color: c.text,
    },
    dayNamesRow: {
      flexDirection: 'row',
      marginBottom: Spacing.xs,
    },
    dayNameText: {
      flex: 1,
      textAlign: 'center',
      fontSize: FontSize.xs,
      fontFamily: Fonts.bodySemiBold,
      color: c.textMuted,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: Spacing.md,
    },
    calendarCell: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    calendarCellSelected: {
      backgroundColor: c.primary,
      borderRadius: BorderRadius.full,
    },
    calendarDayText: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.text,
    },
    calendarDayTextSelected: {
      color: c.white,
      fontFamily: Fonts.bodySemiBold,
    },
    actions: {
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
    saveButton: {
      borderRadius: BorderRadius.md,
    },
    buttonContent: {
      paddingVertical: Spacing.xs,
    },
    cancelButton: {
      borderRadius: BorderRadius.md,
      borderColor: c.border,
    },
    deleteButton: {
      marginTop: Spacing.sm,
    },
  });

export default AddMealScreen;
