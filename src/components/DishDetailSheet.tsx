import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Linking } from 'react-native';
import { Portal, Modal, Text, TextInput, Button, IconButton, Checkbox } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { Dish, Recipe } from '../types';
import { useDishStore } from '../stores/useDishStore';
import { useShoppingStore } from '../stores/useShoppingStore';
import { cuisineIcon } from '../utils/icons';
import { toTitleCase } from '../utils/text';
import { parseRecipeInput, recipeActionLabel, recipeIcon } from '../utils/recipe';

interface Props {
  dish: Dish | null;
  householdId: string;
  onDismiss: () => void;
}

// Tap a dish → view/edit its ingredients and push them to the shared grocery
// list. Ingredients live on the DISH (not the meal), so logging stays 10s; this
// sheet is where a household curates them over time. (Recipe view/edit — Phase 3
// — will slot in below the ingredients.)
export const DishDetailSheet: React.FC<Props> = ({ dish, householdId, onDismiss }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const dishes = useDishStore((s) => s.dishes);
  const addDish = useDishStore((s) => s.addDish);
  const updateDish = useDishStore((s) => s.updateDish);
  const addItems = useShoppingStore((s) => s.addItems);

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  // The real Firestore doc id to write to. Null while the dish is still a
  // "virtual" dish (exists only in meal history, not yet a dishes/ doc).
  const [realId, setRealId] = useState<string | null>(null);
  // Which ingredients to push to grocery — default ALL, but the user unticks the
  // staples they already have at home so only what they need to buy is added.
  const [grocerySel, setGrocerySel] = useState<Set<string>>(new Set());

  // Recipe (Phase 3): a link or typed steps kept on the dish. `recipeDraft` holds
  // the editor text; `editingRecipe` toggles the inline editor.
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeDraft, setRecipeDraft] = useState('');
  const [editingRecipe, setEditingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  useEffect(() => {
    const initial = dish?.ingredients ?? [];
    setIngredients(initial);
    setGrocerySel(new Set(initial));
    setDraft('');
    setRecipe(dish?.recipe ?? null);
    setRecipeDraft(dish?.recipe?.value ?? '');
    setEditingRecipe(false);
    const real = dish ? dishes.some((d) => d.id === dish.id) : false;
    setRealId(real ? dish!.id : null);
    // dishes intentionally omitted: we only want to (re)resolve on dish change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dish]);

  const toggleGrocerySel = (ing: string) =>
    setGrocerySel((prev) => {
      const next = new Set(prev);
      if (next.has(ing)) next.delete(ing);
      else next.add(ing);
      return next;
    });

  // Ensure a real dishes/ doc exists before writing ingredients to it. A dish
  // shown from meal history has no doc yet (its id is the name) — updating that
  // would fail, which is the "error" seen on first ingredient add. Create it
  // once, then reuse the returned id.
  const ensureRealDish = async (withIngredients: string[]): Promise<string> => {
    if (realId) return realId;
    if (!dish) throw new Error('no dish');
    const id = await addDish(householdId, {
      name: toTitleCase(dish.name),
      cuisineTag: dish.cuisineTag,
      categoryTags: dish.categoryTags ?? [],
      isFavorite: dish.isFavorite ?? false,
      timesCooked: dish.timesCooked ?? 0,
      lastCookedDate: dish.lastCookedDate ?? '',
      householdId,
      ...(withIngredients.length ? { ingredients: withIngredients } : {}),
    });
    setRealId(id);
    return id;
  };

  const persist = async (next: string[]) => {
    const prev = ingredients;
    setIngredients(next); // optimistic
    if (!dish) return;
    try {
      if (!realId) {
        // Creating the doc already stores `next` — no follow-up update needed.
        await ensureRealDish(next);
      } else {
        await updateDish(householdId, realId, { ingredients: next });
      }
    } catch {
      setIngredients(prev); // revert
      Alert.alert('Could not save', 'Something went wrong saving that ingredient. Please try again.');
    }
  };

  const addIngredient = () => {
    const text = draft.trim().toLowerCase();
    if (!text) return;
    const exists = ingredients.some((i) => i.toLowerCase() === text);
    if (!exists) {
      persist([...ingredients, text]);
      setGrocerySel((prev) => new Set(prev).add(text)); // new ingredient defaults selected
    }
    setDraft('');
  };

  const removeIngredient = (name: string) => {
    persist(ingredients.filter((i) => i !== name));
    setGrocerySel((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const selectedForGrocery = ingredients.filter((i) => grocerySel.has(i));

  const addToGrocery = async () => {
    if (!dish || selectedForGrocery.length === 0) return;
    setAdding(true);
    try {
      // Make sure the dish is real so its id is a valid reference, then add only
      // the ingredients the user kept ticked (the ones they need to buy).
      const id = await ensureRealDish(ingredients);
      const added = await addItems(householdId, selectedForGrocery, 'dish', id);
      onDismiss();
      Alert.alert(
        'Added to grocery',
        added > 0
          ? `Added ${added} ${added === 1 ? 'item' : 'items'} to your grocery list.`
          : 'Those items are already on your grocery list.',
      );
    } catch {
      Alert.alert('Could not add', 'Something went wrong adding to the grocery list. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const saveRecipe = async () => {
    if (!dish) return;
    const parsed = parseRecipeInput(recipeDraft);
    const prev = recipe;
    setRecipe(parsed);
    setEditingRecipe(false);
    setSavingRecipe(true);
    try {
      if (!realId) {
        // Create the doc, then attach the recipe (ensureRealDish seeds only
        // ingredients, so a follow-up write carries the recipe).
        const id = await ensureRealDish(ingredients);
        await updateDish(householdId, id, { recipe: parsed ?? (null as any) });
      } else {
        await updateDish(householdId, realId, { recipe: parsed ?? (null as any) });
      }
    } catch {
      setRecipe(prev); // revert
      Alert.alert('Could not save', 'Something went wrong saving the recipe. Please try again.');
    } finally {
      setSavingRecipe(false);
    }
  };

  const openRecipe = async () => {
    if (!recipe || recipe.type === 'text') return;
    try {
      const ok = await Linking.canOpenURL(recipe.value);
      if (ok) await Linking.openURL(recipe.value);
      else Alert.alert('Cannot open link', recipe.value);
    } catch {
      Alert.alert('Cannot open link', recipe.value);
    }
  };

  const actionLabel = recipeActionLabel(recipe);

  return (
    <Portal>
      <Modal
        visible={!!dish}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        {dish && (
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{toTitleCase(dish.name)}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.cuisinePill}>
                    <MaterialCommunityIcons
                      name={cuisineIcon(dish.cuisineTag) as any}
                      size={11}
                      color={colors.white}
                    />
                    <Text style={styles.cuisinePillText}>{dish.cuisineTag}</Text>
                  </View>
                  {dish.categoryTags.slice(0, 2).map((t) => (
                    <Text key={t} style={styles.categoryTag}>{t}</Text>
                  ))}
                </View>
              </View>
              <IconButton icon="close" size={22} onPress={onDismiss} iconColor={colors.textSecondary} />
            </View>

            <Text style={styles.sectionLabel}>Ingredients</Text>
            {ingredients.length > 0 && (
              <Text style={styles.tickHint}>Tick the ones you need to buy</Text>
            )}
            <ScrollView style={styles.chipScroll} keyboardShouldPersistTaps="handled">
              {ingredients.length === 0 ? (
                <Text style={styles.emptyHint}>
                  No ingredients yet. Add the few staples you buy for this dish — they’ll
                  feed the grocery list.
                </Text>
              ) : (
                ingredients.map((ing) => (
                  <View key={ing} style={styles.ingRow}>
                    <Checkbox
                      status={grocerySel.has(ing) ? 'checked' : 'unchecked'}
                      onPress={() => toggleGrocerySel(ing)}
                      color={colors.primary}
                      uncheckedColor={colors.textMuted}
                    />
                    <Text style={styles.ingText}>{toTitleCase(ing)}</Text>
                    <IconButton
                      icon="close"
                      size={16}
                      iconColor={colors.textMuted}
                      onPress={() => removeIngredient(ing)}
                      accessibilityLabel={`Remove ${ing}`}
                    />
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.addRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Add an ingredient"
                mode="outlined"
                dense
                style={styles.addInput}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                onSubmitEditing={addIngredient}
                returnKeyType="done"
              />
              <IconButton
                icon="plus-circle"
                size={26}
                iconColor={colors.primary}
                disabled={!draft.trim()}
                onPress={addIngredient}
              />
            </View>

            <Button
              mode="contained"
              icon="cart-plus"
              onPress={addToGrocery}
              loading={adding}
              disabled={adding || selectedForGrocery.length === 0}
              buttonColor={colors.primary}
              style={styles.groceryBtn}
            >
              {selectedForGrocery.length > 0
                ? `Add ${selectedForGrocery.length} to grocery`
                : 'Add to grocery list'}
            </Button>

            <View style={styles.recipeHeaderRow}>
              <Text style={[styles.sectionLabel, styles.recipeLabel]}>Recipe</Text>
              {recipe && !editingRecipe && (
                <IconButton
                  icon="pencil"
                  size={16}
                  iconColor={colors.textMuted}
                  onPress={() => { setRecipeDraft(recipe.value); setEditingRecipe(true); }}
                  accessibilityLabel="Edit recipe"
                />
              )}
            </View>

            {editingRecipe ? (
              <View>
                <TextInput
                  value={recipeDraft}
                  onChangeText={setRecipeDraft}
                  placeholder="Paste a YouTube / recipe link, or type how you make it"
                  mode="outlined"
                  multiline
                  style={styles.recipeInput}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                />
                <View style={styles.recipeEditActions}>
                  <Button
                    mode="text"
                    onPress={() => { setEditingRecipe(false); setRecipeDraft(recipe?.value ?? ''); }}
                    textColor={colors.textSecondary}
                    disabled={savingRecipe}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={saveRecipe}
                    loading={savingRecipe}
                    disabled={savingRecipe}
                    buttonColor={colors.primary}
                  >
                    {parseRecipeInput(recipeDraft) ? 'Save' : recipe ? 'Remove' : 'Save'}
                  </Button>
                </View>
              </View>
            ) : recipe ? (
              recipe.type === 'text' ? (
                <ScrollView style={styles.recipeTextBox} keyboardShouldPersistTaps="handled">
                  <Text style={styles.recipeText}>{recipe.value}</Text>
                </ScrollView>
              ) : (
                <Button
                  mode="outlined"
                  icon={recipeIcon(recipe.type) as any}
                  onPress={openRecipe}
                  textColor={colors.primary}
                  style={styles.recipeOpenBtn}
                >
                  {actionLabel ?? 'Open'}
                </Button>
              )
            ) : (
              <Button
                mode="text"
                icon="plus"
                onPress={() => { setRecipeDraft(''); setEditingRecipe(true); }}
                textColor={colors.primary}
                style={styles.recipeAddBtn}
                contentStyle={styles.recipeAddContent}
              >
                Add a recipe or video link
              </Button>
            )}
          </View>
        )}
      </Modal>
    </Portal>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    modal: {
      backgroundColor: c.surface,
      marginHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    sheet: { padding: Spacing.lg },
    header: { flexDirection: 'row', alignItems: 'flex-start' },
    headerText: { flex: 1 },
    title: { fontSize: FontSize.xl, fontFamily: Fonts.display, color: c.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs, flexWrap: 'wrap' },
    cuisinePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: c.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    cuisinePillText: { fontSize: FontSize.xs, fontFamily: Fonts.bodyMedium, color: c.white },
    categoryTag: { fontSize: FontSize.xs, fontFamily: Fonts.body, color: c.textSecondary },
    sectionLabel: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: Spacing.lg,
      marginBottom: 2,
    },
    tickHint: { fontSize: FontSize.xs, fontFamily: Fonts.body, color: c.textMuted, marginBottom: Spacing.xs },
    chipScroll: { maxHeight: 220 },
    ingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    ingText: { flex: 1, fontSize: FontSize.md, fontFamily: Fonts.body, color: c.text },
    emptyHint: { fontSize: FontSize.sm, fontFamily: Fonts.body, color: c.textSecondary, lineHeight: 20 },
    addRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
    addInput: { flex: 1, backgroundColor: c.background },
    groceryBtn: { marginTop: Spacing.md, borderRadius: BorderRadius.md },
    recipeHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    recipeLabel: { marginBottom: 0 },
    recipeInput: { backgroundColor: c.background, maxHeight: 180, marginTop: Spacing.xs },
    recipeEditActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
    recipeTextBox: {
      maxHeight: 160,
      backgroundColor: c.background,
      borderRadius: BorderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.sm,
      marginTop: Spacing.xs,
    },
    recipeText: { fontSize: FontSize.md, fontFamily: Fonts.body, color: c.text, lineHeight: 21 },
    recipeOpenBtn: { marginTop: Spacing.xs, borderColor: c.primary, borderRadius: BorderRadius.md, alignSelf: 'flex-start' },
    recipeAddBtn: { alignSelf: 'flex-start', marginTop: 2 },
    recipeAddContent: { paddingHorizontal: 0 },
  });

export default DishDetailSheet;
