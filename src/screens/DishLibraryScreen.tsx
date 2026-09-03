import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Searchbar,
  Text,
  FAB,
  Chip,
  Portal,
  Dialog,
  Button,
  TextInput,
  Switch,
  ActivityIndicator,
  Menu,
  Modal,
  IconButton,
  Divider,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { Dish, CuisineTag } from '../types';
import { toTitleCase } from '../utils/text';
import { parseRecipeInput } from '../utils/recipe';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors, makeElevation } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import type { HomeStackParamList } from '../navigation/types';
import { CuisineChips } from '../components/CuisineChips';
import { StarterDishPicker } from '../components/StarterDishPicker';
import { DishDetailSheet } from '../components/DishDetailSheet';
import { CatalogEntry } from '../data/starterCatalog';
import { catalogEntriesToDishes } from '../utils/starterDishes';
import { cuisineIcon } from '../utils/icons';
import { useDishStore } from '../stores/useDishStore';
import { useMealStore } from '../stores/useMealStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { aggregateDishes } from '../utils/dishStats';
import { formatDaysAgo } from '../utils/relativeDate';
import { DishShareModal } from '../components/DishShareModal';
import { DishPackImport } from '../components/DishPackImport';

type SortMode = 'lastMade' | 'mostMade' | 'az' | 'favorites';
type LibraryView = 'month' | 'all' | 'favorites' | 'stale';
type Audience = 'family' | 'kids';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'lastMade', label: 'Last made' },
  { value: 'mostMade', label: 'Most made' },
  { value: 'az', label: 'A-Z' },
  { value: 'favorites', label: 'Favorites' },
];

const getDaysSince = (dateStr: string): number => {
  if (!dateStr) return 999;
  // Parse as LOCAL midnight (bare 'yyyy-MM-dd' would parse as UTC and skew by a day).
  const then = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
};

export const DishLibraryScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const elevation = useMemo(() => makeElevation(isDark), [isDark]);

  const { dishes, isLoading, error, fetchDishes, addDish, addDishesBatch, updateDish, toggleFavorite: storeFavorite } = useDishStore();
  const [exploreVisible, setExploreVisible] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const { user } = useAuthStore();
  const household = useHouseholdStore((s) => s.household);
  const householdId = user?.householdId ?? '';

  const { meals, fetchAllMeals } = useMealStore();
  const route = useRoute<RouteProp<HomeStackParamList, 'DishLibrary'>>();
  const focusNames = route.params?.focusNames;
  const dateWindow = route.params?.window;
  const paramAudience: Audience = route.params?.audience ?? 'family';
  const paramView: LibraryView = route.params?.view ?? 'month';
  const focusSet = useMemo(
    () => (focusNames ? new Set(focusNames.map((n) => n.toLowerCase())) : null),
    [focusNames],
  );

  useEffect(() => {
    if (householdId) {
      fetchDishes(householdId);
      fetchAllMeals(householdId).catch(() => {});
    }
  }, [householdId, fetchDishes]);

  // Local yyyy-MM-dd today + this-month start (meal.date is a local date string).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState<Audience>(paramAudience);
  // The pill preset. Each preset is self-sufficient: it recomputes the list from
  // the right aggregate, so tapping "Not made 30+" always returns real results
  // (the old bug was a hidden scope silently emptying it).
  const [view, setView] = useState<LibraryView>(paramView);
  // Stale view sorts by last-made (it's about rotation); the rest by most-made
  // so go-to dishes surface first. The tune menu can override within a view.
  const [sortMode, setSortMode] = useState<SortMode>(paramView === 'stale' ? 'lastMade' : 'mostMade');
  const [cuisineFilter, setCuisineFilter] = useState<CuisineTag | null>(null);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Add dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCuisine, setNewCuisine] = useState<CuisineTag>('Indian');
  const [newTags, setNewTags] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [newRecipe, setNewRecipe] = useState('');
  const [newFavorite, setNewFavorite] = useState(false);
  const [addingDish, setAddingDish] = useState(false);

  // Reset the whole view from the CURRENT params on every entry. Dish Library is
  // opened for different intents (browse, "this month", a single dish from
  // Insights, the stale list, kids tiffins) and can be revisited without
  // unmounting, so a prior visit's audience/view/sort must never linger.
  useFocusEffect(
    useCallback(() => {
      setAudience(paramAudience);
      setView(paramView);
      setSortMode(paramView === 'stale' ? 'lastMade' : 'mostMade');
      setSearch('');
      setCuisineFilter(null);
    }, [paramAudience, paramView]),
  );

  // Whether the household has ANY kids-tiffin history — gates the Family|Kids
  // audience toggle (a family that never logs kids meals never sees it).
  const hasKids = useMemo(() => meals.some((m) => m.audience === 'kids'), [meals]);

  // Meals for the active audience. Kids dishes derive purely from kids meals (no
  // library seed); family dishes seed from the saved library ∪ family home meals.
  const audienceMeals = useMemo(
    () => meals.filter((m) => (audience === 'kids' ? m.audience === 'kids' : m.audience !== 'kids')),
    [meals, audience],
  );
  // Kids dishes derive purely from kids meals (no library seed); memoized so the
  // empty array keeps a stable identity and the aggregates don't recompute each render.
  const seed = useMemo(() => (audience === 'kids' ? [] : dishes), [audience, dishes]);

  // All-time dishes for this audience (Show all / Favorites / Not made 30+).
  const baseDishes = useMemo(
    () => aggregateDishes(seed, audienceMeals, { today }),
    [seed, audienceMeals, today],
  );
  // Month-scoped counts (the This month view).
  const monthDishes = useMemo(
    () => aggregateDishes(seed, audienceMeals, { today, window: { start: thisMonthStart, end: today } }),
    [seed, audienceMeals, today, thisMonthStart],
  );
  // Window-scoped counts for the Insights single-dish focus (else = all-time).
  const focusDishes = useMemo(
    () => (dateWindow ? aggregateDishes(seed, audienceMeals, { today, window: dateWindow }) : baseDishes),
    [seed, audienceMeals, today, dateWindow, baseDishes],
  );

  const filteredDishes = useMemo(() => {
    let result: Dish[];

    if (focusSet) {
      // Insights single-dish (or few) focus, optionally window-scoped.
      result = focusDishes.filter((d) => focusSet.has(d.name.toLowerCase()));
      if (dateWindow) result = result.filter((d) => d.timesCooked > 0);
    } else {
      switch (view) {
        case 'month':
          // Only dishes actually cooked this month (counts are month-scoped).
          result = monthDishes.filter((d) => d.timesCooked > 0);
          break;
        case 'favorites':
          result = baseDishes.filter((d) => d.isFavorite);
          break;
        case 'stale':
          result = baseDishes.filter((d) => getDaysSince(d.lastCookedDate) >= 30);
          break;
        case 'all':
        default:
          result = [...baseDishes];
          break;
      }
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.cuisineTag.toLowerCase().includes(q) ||
          d.categoryTags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Cuisine filter
    if (cuisineFilter) result = result.filter((d) => d.cuisineTag === cuisineFilter);

    // Sort
    switch (sortMode) {
      case 'lastMade':
        result.sort((a, b) => getDaysSince(b.lastCookedDate) - getDaysSince(a.lastCookedDate));
        break;
      case 'mostMade':
        result.sort((a, b) => b.timesCooked - a.timesCooked);
        break;
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'favorites':
        result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
        break;
    }

    return result;
  }, [focusSet, focusDishes, dateWindow, view, monthDishes, baseDishes, search, cuisineFilter, sortMode]);

  const onRefresh = useCallback(async () => {
    if (!householdId) return;
    setRefreshing(true);
    await Promise.all([fetchDishes(householdId, true), fetchAllMeals(householdId, true)]);
    setRefreshing(false);
  }, [householdId, fetchDishes, fetchAllMeals]);

  const toggleFavorite = useCallback(
    async (dish: Dish) => {
      if (!householdId) return;
      try {
        const isRealDish = dishes.some((d) => d.id === dish.id);
        if (!isRealDish) {
          // Virtual dish from meal history — create it in Firestore with favorite=true
          await addDish(householdId, {
            name: dish.name,
            cuisineTag: dish.cuisineTag,
            categoryTags: dish.categoryTags ?? [],
            isFavorite: true,
            timesCooked: dish.timesCooked,
            lastCookedDate: dish.lastCookedDate,
            householdId,
          });
        } else {
          await updateDish(householdId, dish.id, { isFavorite: !dish.isFavorite });
        }
        await fetchDishes(householdId);
      } catch {
        Alert.alert('Error', 'Could not update favorite status.');
      }
    },
    [householdId, dishes, addDish, updateDish, fetchDishes],
  );

  const handleAddDish = useCallback(async () => {
    if (!householdId || !newName.trim()) return;
    setAddingDish(true);
    try {
      const ingList = newIngredients
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const recipe = parseRecipeInput(newRecipe);
      await addDish(householdId, {
        name: toTitleCase(newName.trim()),
        cuisineTag: newCuisine,
        categoryTags: newTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isFavorite: newFavorite,
        timesCooked: 0,
        lastCookedDate: '',
        householdId,
        ...(ingList.length ? { ingredients: ingList } : {}),
        ...(recipe ? { recipe } : {}),
      });
      await fetchDishes(householdId);
      setDialogVisible(false);
      setNewName('');
      setNewTags('');
      setNewIngredients('');
      setNewRecipe('');
      setNewFavorite(false);
    } catch {
      Alert.alert('Error', 'Could not add dish.');
    } finally {
      setAddingDish(false);
    }
  }, [householdId, newName, newCuisine, newTags, newFavorite, addDish, fetchDishes]);

  const handleExploreCommit = useCallback(
    async (entries: CatalogEntry[]) => {
      if (!householdId || entries.length === 0) {
        setExploreVisible(false);
        return;
      }
      setSeeding(true);
      try {
        const added = await addDishesBatch(householdId, catalogEntriesToDishes(entries, householdId));
        setExploreVisible(false);
        Alert.alert(
          'Dishes added',
          added.length
            ? `Added ${added.length} ${added.length === 1 ? 'dish' : 'dishes'} to your library.`
            : 'Those dishes are already in your library.',
        );
      } catch {
        Alert.alert('Error', 'Could not add dishes. Please try again.');
      } finally {
        setSeeding(false);
      }
    },
    [householdId, addDishesBatch],
  );

  const existingNames = useMemo(() => dishes.map((d) => d.name), [dishes]);

  const uniqueCuisines = useMemo(() => {
    const set = new Set(dishes.map((d) => d.cuisineTag));
    return Array.from(set).sort();
  }, [dishes]);

  const renderDish = useCallback(
    ({ item }: { item: Dish }) => {
      const daysSince = getDaysSince(item.lastCookedDate);
      const daysColor = daysSince >= 60 ? colors.error : colors.textSecondary;

      return (
        <TouchableOpacity
          style={[styles.dishRow, elevation.e1]}
          onPress={() => setDetailDish(item)}
          accessibilityLabel={`${item.name}, ${item.cuisineTag}, made ${item.timesCooked} times. Opens ingredients.`}
        >
          <TouchableOpacity
            onPress={() => toggleFavorite(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={item.isFavorite ? `Unfavorite ${item.name}` : `Favorite ${item.name}`}
          >
            <MaterialCommunityIcons
              name={item.isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={item.isFavorite ? colors.warning : colors.textMuted}
              style={styles.starIcon}
            />
          </TouchableOpacity>
          <View style={styles.dishInfo}>
            <Text style={styles.dishName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.dishMeta}>
              <View style={styles.cuisinePill}>
                <MaterialCommunityIcons
                  name={cuisineIcon(item.cuisineTag) as any}
                  size={11}
                  color={colors.white}
                />
                <Text style={styles.cuisinePillText}>{item.cuisineTag}</Text>
              </View>
              {/* Discoverability pills — make it obvious a dish holds ingredients
                  and a recipe. Both open the same detail sheet; active style when
                  the dish already has that content. */}
              <TouchableOpacity
                style={[styles.metaPill, item.ingredients?.length ? styles.metaPillActive : null]}
                onPress={() => setDetailDish(item)}
                accessibilityLabel={`Ingredients for ${item.name}`}
              >
                <MaterialCommunityIcons name="basket-outline" size={11} color={item.ingredients?.length ? colors.primary : colors.textSecondary} />
                <Text style={[styles.metaPillText, item.ingredients?.length ? styles.metaPillTextActive : null]}>
                  {item.ingredients?.length ? `Ingredients · ${item.ingredients.length}` : 'Ingredients'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metaPill, item.recipe ? styles.metaPillActive : null]}
                onPress={() => setDetailDish(item)}
                accessibilityLabel={`Recipe for ${item.name}`}
              >
                <MaterialCommunityIcons name={item.recipe?.type === 'youtube' ? 'youtube' : 'book-open-variant'} size={11} color={item.recipe ? colors.primary : colors.textSecondary} />
                <Text style={[styles.metaPillText, item.recipe ? styles.metaPillTextActive : null]}>Recipe</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.dishStats}>
            <Text style={[styles.daysText, { color: daysColor }]}>
              {item.lastCookedDate ? formatDaysAgo(daysSince, { compact: true }) : 'Never'}
            </Text>
            <Text style={styles.countText}>{item.timesCooked}x</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [toggleFavorite, colors, styles, elevation],
  );

  if (isLoading && dishes.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dishes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search + a single filter control (sort + cuisine together) */}
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Search dishes..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor={colors.textSecondary}
          placeholderTextColor={colors.textMuted}
        />
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <IconButton
              icon="tune-variant"
              mode="contained-tonal"
              size={22}
              onPress={() => setFilterMenuVisible(true)}
              iconColor={cuisineFilter || sortMode !== 'mostMade' ? colors.primary : colors.textSecondary}
              style={styles.filterIconBtn}
              accessibilityLabel="Sort and filter"
            />
          }
        >
          <Text style={styles.menuHeader}>Sort by</Text>
          {SORT_OPTIONS.map((opt) => (
            <Menu.Item
              key={opt.value}
              title={opt.label}
              trailingIcon={sortMode === opt.value ? 'check' : undefined}
              onPress={() => {
                setSortMode(opt.value);
                setFilterMenuVisible(false);
              }}
            />
          ))}
          <Divider />
          <Text style={styles.menuHeader}>Cuisine</Text>
          <Menu.Item
            title="All cuisines"
            trailingIcon={!cuisineFilter ? 'check' : undefined}
            onPress={() => {
              setCuisineFilter(null);
              setFilterMenuVisible(false);
            }}
          />
          {uniqueCuisines.map((c) => (
            <Menu.Item
              key={c}
              title={c}
              trailingIcon={cuisineFilter === c ? 'check' : undefined}
              onPress={() => {
                setCuisineFilter(c);
                setFilterMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      {/* Audience toggle (only when the family has kids-tiffin history) + the
          four self-sufficient view pills. Hidden in the Insights focus view. */}
      {!focusSet && (
        <>
          {hasKids && (
            <View style={styles.audienceRow}>
              {(['family', 'kids'] as const).map((a) => {
                const selected = audience === a;
                return (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setAudience(a)}
                    style={[styles.audienceTab, selected && styles.audienceTabSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={a === 'family' ? 'Family dishes' : 'Kids tiffin dishes'}
                  >
                    <Text style={[styles.audienceTabText, selected && styles.audienceTabTextSelected]}>
                      {a === 'family' ? 'Family' : 'Kids tiffins'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={styles.quickFilterRow}>
            {(
              [
                { key: 'month', label: 'This month' },
                { key: 'all', label: 'Show all' },
                { key: 'favorites', label: 'Favorites' },
                { key: 'stale', label: 'Not made 30+' },
              ] as const
            ).map(({ key, label }) => {
              const selected = view === key;
              return (
                <Chip
                  key={key}
                  compact
                  selected={selected}
                  onPress={() => {
                    setView(key);
                    setSortMode(key === 'stale' ? 'lastMade' : 'mostMade');
                  }}
                  style={[styles.quickChip, selected && styles.quickChipSelected]}
                  textStyle={[styles.quickChipText, selected && styles.quickChipTextSelected]}
                >
                  {label}
                </Chip>
              );
            })}
          </View>
        </>
      )}

      {/* Explore the global catalog, share your dishes, or import a code — the
          three dish-collection actions on one compact row. */}
      {!focusSet && (
        <View style={styles.packRow}>
          <TouchableOpacity
            onPress={() => setExploreVisible(true)}
            style={styles.packBtn}
            accessibilityLabel="Explore more dishes to add"
          >
            <MaterialCommunityIcons name="earth" size={17} color={colors.primary} />
            <Text style={styles.packBtnText}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShareVisible(true)}
            style={styles.packBtn}
            accessibilityLabel="Share your dishes"
          >
            <MaterialCommunityIcons name="gift-outline" size={17} color={colors.primary} />
            <Text style={styles.packBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setImportVisible(true)}
            style={styles.packBtn}
            accessibilityLabel="Import dishes from a code"
          >
            <MaterialCommunityIcons name="import" size={17} color={colors.home} />
            <Text style={[styles.packBtnText, { color: colors.home }]}>Import</Text>
          </TouchableOpacity>
        </View>
      )}

      {dateWindow && (
        <Text style={styles.windowNote}>
          Counts for {dateWindow.label ?? 'the selected period'}
        </Text>
      )}

      {error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="outlined" onPress={onRefresh}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredDishes}
          keyExtractor={(item) => item.id}
          renderItem={renderDish}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="food-off" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No dishes found</Text>
              <Text style={styles.emptySubtext}>
                {search ? 'Try a different search' : 'Tap + to add your first dish'}
              </Text>
            </View>
          }
          ListFooterComponent={
            filteredDishes.length > 0 ? (
              <Text style={styles.footer}>
                {filteredDishes.length} {filteredDishes.length === 1 ? 'dish' : 'dishes'}
              </Text>
            ) : null
          }
          contentContainerStyle={filteredDishes.length === 0 ? styles.emptyList : undefined}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.white}
        onPress={() => setDialogVisible(true)}
        accessibilityLabel="Add dish"
      />

      {/* Add Dish Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Add Dish</Dialog.Title>
          <Dialog.Content>
           <ScrollView style={styles.dialogScroll} keyboardShouldPersistTaps="handled">
            <TextInput
              label="Dish name"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <Text style={styles.dialogLabel}>Cuisine</Text>
            <CuisineChips selected={newCuisine} onSelect={setNewCuisine} />
            <TextInput
              label="Category tags (comma separated)"
              value={newTags}
              onChangeText={setNewTags}
              mode="outlined"
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <TextInput
              label="Ingredients (comma separated)"
              value={newIngredients}
              onChangeText={setNewIngredients}
              mode="outlined"
              placeholder="e.g. rice, dal, onion, tomato"
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <TextInput
              label="Recipe (link or steps)"
              key={dialogVisible ? 'newrecipe-open' : 'newrecipe-closed'}
              defaultValue={newRecipe}
              onChangeText={setNewRecipe}
              mode="outlined"
              multiline
              placeholder="Paste a YouTube / recipe link, or type how you make it"
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Favorite</Text>
              <Switch
                value={newFavorite}
                onValueChange={setNewFavorite}
                color={colors.primary}
              />
            </View>
           </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleAddDish}
              loading={addingDish}
              disabled={!newName.trim() || addingDish}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Explore dishes — reuses the onboarding starter picker */}
        <Modal
          visible={exploreVisible}
          onDismiss={() => !seeding && setExploreVisible(false)}
          contentContainerStyle={styles.exploreModal}
        >
          <StarterDishPicker
            mode="explore"
            existingNames={existingNames}
            committing={seeding}
            onCommit={handleExploreCommit}
            onSkip={() => setExploreVisible(false)}
          />
        </Modal>
      </Portal>

      <DishDetailSheet
        dish={detailDish}
        householdId={householdId}
        onDismiss={() => setDetailDish(null)}
      />

      <DishShareModal
        visible={shareVisible}
        householdId={householdId}
        userId={user?.id ?? ''}
        householdName={household?.name ?? 'a Sofra family'}
        onClose={() => setShareVisible(false)}
      />

      <DishPackImport
        visible={importVisible}
        householdId={householdId}
        existingDishNames={existingNames}
        onClose={() => setImportVisible(false)}
        onImported={() => { if (householdId) fetchDishes(householdId, true); }}
      />
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      gap: Spacing.xs,
    },
    searchbar: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      elevation: 1,
    },
    filterIconBtn: {
      margin: 0,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
    },
    menuHeader: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: 2,
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    exploreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.primary,
      borderStyle: 'dashed',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    exploreRowText: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: Fonts.bodySemiBold,
      color: c.primary,
    },
    packRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
    },
    packBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
    },
    packBtnText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodySemiBold,
      color: c.primary,
    },
    exploreChip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.primary,
      borderStyle: 'dashed',
    },
    exploreChipText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.primary,
    },
    searchInput: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.text,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    filterChip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterChipText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.text,
    },
    // Wrapping pill row (This month / Show all / Favorites / Not made 30+) — wraps
    // to a second line rather than scrolling, so a pill is never half-cut-off.
    quickFilterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      gap: 6,
      marginBottom: Spacing.sm,
    },
    audienceRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      backgroundColor: c.surfaceVariant,
      borderRadius: BorderRadius.full,
      padding: 3,
    },
    audienceTab: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    audienceTabSelected: { backgroundColor: c.primary },
    audienceTabText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: c.textSecondary },
    audienceTabTextSelected: { color: c.white, fontFamily: Fonts.bodySemiBold },
    exploreBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    exploreText: {
      flex: 1,
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.text,
    },
    exploreModal: {
      flex: 1,
      margin: 0,
      backgroundColor: c.background,
    },
    windowNote: {
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    quickChip: {
      backgroundColor: c.surfaceVariant,
    },
    quickChipSelected: {
      backgroundColor: c.primary,
    },
    quickChipText: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.bodyMedium,
      color: c.text,
      marginVertical: 4,
    },
    quickChipTextSelected: {
      color: c.white,
    },
    dishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    starIcon: {
      marginRight: Spacing.sm,
    },
    dishInfo: {
      flex: 1,
    },
    dishName: {
      fontSize: FontSize.lg,
      fontFamily: Fonts.bodySemiBold,
      color: c.text,
      marginBottom: 2,
    },
    dishMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      flexWrap: 'wrap',
    },
    cuisinePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      backgroundColor: c.primaryLight,
    },
    cuisinePillText: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.bodySemiBold,
      color: c.white,
    },
    metaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    metaPillActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight + '22',
    },
    metaPillText: { fontSize: FontSize.xs, fontFamily: Fonts.bodyMedium, color: c.textSecondary },
    metaPillTextActive: { color: c.primary, fontFamily: Fonts.bodySemiBold },
    dialogScroll: { maxHeight: 380 },
    categoryTag: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.body,
      color: c.textSecondary,
      backgroundColor: c.surfaceVariant,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      overflow: 'hidden',
    },
    dishStats: {
      alignItems: 'flex-end',
      marginLeft: Spacing.sm,
    },
    daysText: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
    },
    countText: {
      fontSize: FontSize.xs,
      fontFamily: Fonts.body,
      color: c.textMuted,
      marginTop: 2,
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.textSecondary,
    },
    errorText: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.error,
      marginVertical: Spacing.md,
      textAlign: 'center',
    },
    emptyList: {
      flexGrow: 1,
    },
    emptyText: {
      fontSize: FontSize.lg,
      fontFamily: Fonts.displayMedium,
      color: c.textSecondary,
      marginTop: Spacing.md,
    },
    emptySubtext: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.textMuted,
      marginTop: Spacing.xs,
    },
    footer: {
      textAlign: 'center',
      fontSize: FontSize.sm,
      fontFamily: Fonts.body,
      color: c.textMuted,
      paddingVertical: Spacing.md,
    },
    fab: {
      position: 'absolute',
      right: Spacing.md,
      bottom: Spacing.md,
      backgroundColor: c.primary,
      borderRadius: BorderRadius.full,
    },
    dialog: {
      backgroundColor: c.surface,
    },
    dialogTitle: {
      fontFamily: Fonts.display,
      color: c.text,
    },
    dialogInput: {
      backgroundColor: c.surface,
      marginBottom: Spacing.sm,
    },
    dialogLabel: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.textSecondary,
      marginBottom: Spacing.xs,
      marginTop: Spacing.xs,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    switchLabel: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.text,
    },
  });

export default DishLibraryScreen;
