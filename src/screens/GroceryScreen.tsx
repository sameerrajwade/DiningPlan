import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, IconButton, Checkbox, Menu } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, startOfWeek, endOfWeek, addWeeks, getDay } from 'date-fns';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../stores/useAuthStore';
import { useShoppingStore } from '../stores/useShoppingStore';
import { useMealStore } from '../stores/useMealStore';
import { useDishStore } from '../stores/useDishStore';
import { GroceryItem } from '../types';
import { toTitleCase } from '../utils/text';
import { ingredientsForDishes } from '../utils/grocery';
import { matchCatalogDish } from '../utils/starterDishes';

export const GroceryScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuthStore();
  const householdId = user?.householdId ?? '';

  const { items, isLoading, fetchItems, addItems, toggleChecked, removeItem, clearChecked, clearAll } =
    useShoppingStore();
  const meals = useMealStore((s) => s.meals);
  const fetchAllMeals = useMealStore((s) => s.fetchAllMeals);
  const dishes = useDishStore((s) => s.dishes);
  const fetchDishes = useDishStore((s) => s.fetchDishes);

  const [newItem, setNewItem] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    if (householdId) {
      fetchItems(householdId);
      fetchAllMeals(householdId);
      fetchDishes(householdId);
    }
  }, [householdId, fetchItems, fetchAllMeals, fetchDishes]);

  // Which week to shop for: earlier in the week (Mon–Wed) you're still cooking
  // THIS week's plan; from Thursday on you're shopping for NEXT week. The button
  // label follows this so the user always pulls the right week's ingredients.
  const targetWeek = useMemo(() => {
    const now = new Date();
    const dow = getDay(now); // 0 Sun .. 6 Sat
    const useNext = !(dow >= 1 && dow <= 3);
    const base = useNext ? addWeeks(now, 1) : now;
    return {
      label: useNext ? 'next week' : 'this week',
      start: format(startOfWeek(base, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(base, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    };
  }, []);

  const addFromPlan = useCallback(async () => {
    if (!householdId || pulling) return;
    const weekMeals = meals.filter(
      (m) => m.sourceType === 'home' && m.date >= targetWeek.start && m.date <= targetWeek.end,
    );
    const names = new Set<string>();
    weekMeals.forEach((m) => {
      const list = m.items?.length ? m.items.map((i) => i.name) : [m.dishName];
      list.forEach((n) => { if (n) names.add(n.toLowerCase()); });
    });
    if (names.size === 0) {
      Alert.alert(
        'No planned dishes',
        `There are no home-cooked dishes planned for ${targetWeek.label}. Generate and accept a plan in the Plan tab first.`,
      );
      return;
    }
    const byName = new Map(dishes.map((d) => [d.name.toLowerCase(), d]));
    // Prefer ingredients saved on the dish; fall back to the curated catalog so
    // dishes like "Avocado Toast" (ingredients live in the catalog, not yet on
    // the dish doc) still contribute to the grocery list.
    const ingLists = Array.from(names).map((n) => {
      const saved = byName.get(n)?.ingredients;
      return saved?.length ? saved : matchCatalogDish(n)?.ingredients;
    });
    const toAdd = ingredientsForDishes(ingLists);
    if (toAdd.length === 0) {
      Alert.alert(
        'No ingredients yet',
        `The dishes planned for ${targetWeek.label} don't have ingredients saved yet. Open those dishes in your Dish Library, add ingredients, then try again.`,
      );
      return;
    }
    setPulling(true);
    try {
      const added = await addItems(householdId, toAdd, 'dish');
      Alert.alert(
        'Grocery list updated',
        added > 0
          ? `Added ${added} ${added === 1 ? 'item' : 'items'} from ${targetWeek.label}'s plan.`
          : `Those ingredients are already on your list.`,
      );
    } catch {
      Alert.alert('Could not add', 'Something went wrong updating the grocery list. Please try again.');
    } finally {
      setPulling(false);
    }
  }, [householdId, pulling, meals, dishes, targetWeek, addItems]);

  const onRefresh = useCallback(async () => {
    if (!householdId) return;
    setRefreshing(true);
    await fetchItems(householdId, true);
    setRefreshing(false);
  }, [householdId, fetchItems]);

  const handleAdd = useCallback(async () => {
    const text = newItem.trim();
    if (!text || !householdId) return;
    setAdding(true);
    try {
      const added = await addItems(householdId, [text], 'manual');
      setNewItem('');
      if (added === 0) {
        Alert.alert('Already on the list', `“${text}” is already in your grocery list.`);
      }
    } catch {
      Alert.alert('Error', 'Could not add that item.');
    } finally {
      setAdding(false);
    }
  }, [newItem, householdId, addItems]);

  // Unchecked first (newest activity at top of each group), checked sink to the
  // bottom so what's left to buy is always in view.
  const sorted = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked);
    const checked = items.filter((i) => i.checked);
    return [...unchecked, ...checked];
  }, [items]);

  const remaining = items.filter((i) => !i.checked).length;
  const checkedCount = items.length - remaining;

  const confirmClear = (mode: 'checked' | 'all') => {
    setMenuVisible(false);
    const title = mode === 'checked' ? 'Clear checked items?' : 'Clear the whole list?';
    const msg =
      mode === 'checked'
        ? 'This removes everything you’ve ticked off.'
        : 'This removes every item, checked or not.';
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => (mode === 'checked' ? clearChecked(householdId) : clearAll(householdId)),
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: GroceryItem }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => toggleChecked(householdId, item.id)}
        accessibilityLabel={`${item.text}${item.checked ? ', checked' : ''}`}
      >
        <Checkbox
          status={item.checked ? 'checked' : 'unchecked'}
          onPress={() => toggleChecked(householdId, item.id)}
          color={colors.primary}
          uncheckedColor={colors.textMuted}
        />
        <Text style={[styles.rowText, item.checked && styles.rowTextChecked]}>{toTitleCase(item.text)}</Text>
        {item.source === 'dish' && (
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={14}
            color={colors.textMuted}
            style={styles.rowTag}
          />
        )}
        <IconButton
          icon="close"
          size={16}
          iconColor={colors.textMuted}
          onPress={() => removeItem(householdId, item.id)}
          accessibilityLabel={`Remove ${item.text}`}
        />
      </TouchableOpacity>
    ),
    [householdId, toggleChecked, removeItem, colors, styles],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Add row */}
      <View style={styles.addRow}>
        <TextInput
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Add an item (e.g. dishwashing pods)"
          mode="outlined"
          dense
          style={styles.addInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          left={<TextInput.Icon icon="plus" />}
        />
        <IconButton
          icon="arrow-up-circle"
          size={28}
          iconColor={colors.primary}
          disabled={!newItem.trim() || adding}
          onPress={handleAdd}
        />
      </View>

      {/* Pull ingredients from the relevant week's plan (this/next week by day) */}
      <TouchableOpacity
        style={styles.planPull}
        onPress={addFromPlan}
        disabled={pulling}
        accessibilityLabel={`Add ${targetWeek.label}'s plan ingredients to grocery`}
      >
        <MaterialCommunityIcons name="calendar-import" size={18} color={colors.primary} />
        <Text style={styles.planPullText}>{`Add ${targetWeek.label}'s plan ingredients`}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>

      {/* Summary + actions */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          {items.length === 0
            ? 'Your list is empty'
            : `${remaining} to buy${checkedCount ? ` · ${checkedCount} done` : ''}`}
        </Text>
        {items.length > 0 && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuAnchor}>
                <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              title="Clear checked"
              leadingIcon="check-all"
              disabled={checkedCount === 0}
              onPress={() => confirmClear('checked')}
            />
            <Menu.Item title="Clear all" leadingIcon="trash-can-outline" onPress={() => confirmClear('all')} />
          </Menu>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="cart-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nothing to buy yet</Text>
              <Text style={styles.emptySub}>
                Add items above, or open a dish and tap “Add to grocery” to pull in its
                ingredients. It’s one shared list for the whole household.
              </Text>
            </View>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
    },
    addInput: { flex: 1, backgroundColor: c.surface },
    planPull: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.primary,
      borderStyle: 'dashed',
      backgroundColor: c.surface,
    },
    planPullText: { flex: 1, fontSize: FontSize.md, fontFamily: Fonts.bodySemiBold, color: c.primary },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    summaryText: { fontSize: FontSize.sm, fontFamily: Fonts.bodyMedium, color: c.textSecondary },
    menuAnchor: { padding: Spacing.xs },
    list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
    emptyList: { flexGrow: 1, justifyContent: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.xs,
      paddingLeft: Spacing.xs,
      paddingRight: 0,
    },
    rowText: { flex: 1, fontSize: FontSize.md, fontFamily: Fonts.body, color: c.text },
    rowTextChecked: { textDecorationLine: 'line-through', color: c.textMuted },
    rowTag: { marginRight: Spacing.xs },
    empty: { alignItems: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    emptyTitle: { fontSize: FontSize.lg, fontFamily: Fonts.displayMedium, color: c.text },
    emptySub: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.body,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default GroceryScreen;
