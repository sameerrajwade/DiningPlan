import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Chip, Button, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import {
  CatalogEntry,
  DishCategory,
  STARTER_CATALOG,
  CATALOG_COUNTRIES,
  regionsForCountry,
} from '../data/starterCatalog';
import {
  DietPreference,
  normalizeName,
  pickStarterDishes,
  suggestCatalogDishes,
  matchCatalogDish,
} from '../utils/starterDishes';

interface Props {
  mode: 'onboarding' | 'explore';
  /** Dish names already in the library — hidden from the pool so nothing dupes. */
  existingNames?: string[];
  /** Parent-controlled loading state for the commit button. */
  committing?: boolean;
  /** Called with the chosen catalog entries when the user confirms. */
  onCommit: (entries: CatalogEntry[]) => void | Promise<void>;
  /** Skip (onboarding) / cancel (explore). */
  onSkip?: () => void;
}

// Countries surfaced first in the picker (primary market + globally common),
// the rest follow alphabetically. Purely ordering — every country is selectable.
const POPULAR_FIRST = [
  'India', 'USA', 'China', 'Italy', 'Mexico', 'Thailand', 'Japan',
  'Korea', 'Vietnam', 'Pakistan', 'UK', 'Spain', 'Greece', 'Turkey',
];

const CATEGORY_ORDER: DishCategory[] = [
  'main', 'side', 'rice', 'bread', 'breakfast', 'snack', 'sweet',
];
const CATEGORY_LABEL: Record<DishCategory, string> = {
  main: 'Mains',
  side: 'Sides & dals',
  rice: 'Rice',
  bread: 'Breads',
  breakfast: 'Breakfast',
  snack: 'Snacks',
  sweet: 'Sweets',
};

const DEFAULT_PICK_LIMIT = 24; // pre-ticked balanced starter set
const GROUP_COLLAPSED = 8; // chips shown per group before "show more"

type Step = 'countries' | 'regions' | 'dishes';

export const StarterDishPicker: React.FC<Props> = ({
  mode,
  existingNames = [],
  committing = false,
  onCommit,
  onSkip,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [step, setStep] = useState<Step>('countries');
  const [countries, setCountries] = useState<string[]>(
    mode === 'onboarding' ? ['India'] : [],
  );
  const [regions, setRegions] = useState<string[]>([]);
  const [diet, setDiet] = useState<DietPreference>('both');
  const [countrySearch, setCountrySearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [ownName, setOwnName] = useState('');

  // Selected dishes, keyed by normalized name (so custom + catalog never dupe).
  const [selected, setSelected] = useState<Map<string, CatalogEntry>>(new Map());

  const existingSet = useMemo(
    () => new Set(existingNames.map((n) => normalizeName(n))),
    [existingNames],
  );

  // ── Country list (popular first, then alphabetical, filtered by search) ──
  const orderedCountries = useMemo(() => {
    const all = [...CATALOG_COUNTRIES].sort((a, b) => a.localeCompare(b));
    const pop = POPULAR_FIRST.filter((c) => all.includes(c));
    const rest = all.filter((c) => !pop.includes(c));
    const ordered = [...pop, ...rest];
    const q = countrySearch.trim().toLowerCase();
    return q ? ordered.filter((c) => c.toLowerCase().includes(q)) : ordered;
  }, [countrySearch]);

  // Selected countries that actually have multiple regions → drive the region step.
  const multiRegionCountries = useMemo(
    () => countries.filter((c) => regionsForCountry(c).length > 1),
    [countries],
  );

  // ── The dish pool for the chosen countries/regions/diet ──
  const pool = useMemo(() => {
    let list = STARTER_CATALOG.filter((e) => countries.includes(e.country));
    if (regions.length) {
      // Keep dishes whose region is selected OR whose country is single-region
      list = list.filter(
        (e) => regions.includes(e.region) || regionsForCountry(e.country).length <= 1,
      );
    }
    if (diet === 'veg') list = list.filter((e) => e.diet === 'veg');
    // De-dupe by normalized name (highest weight wins), drop already-owned.
    const byKey = new Map<string, CatalogEntry>();
    for (const e of list) {
      const key = normalizeName(e.name);
      if (existingSet.has(key)) continue;
      const cur = byKey.get(key);
      if (!cur || (e.weight ?? 2) > (cur.weight ?? 2)) byKey.set(key, e);
    }
    return byKey;
  }, [countries, regions, diet, existingSet]);

  const grouped = useMemo(() => {
    const g: Record<DishCategory, CatalogEntry[]> = {
      main: [], side: [], rice: [], bread: [], breakfast: [], snack: [], sweet: [],
    };
    for (const e of pool.values()) g[e.category].push(e);
    for (const cat of CATEGORY_ORDER) {
      g[cat].sort((a, b) => (b.weight ?? 2) - (a.weight ?? 2) || a.name.localeCompare(b.name));
    }
    return g;
  }, [pool]);

  const toggleCountry = (c: string) =>
    setCountries((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  const toggleRegion = (r: string) =>
    setRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  const isSelected = (e: CatalogEntry) => selected.has(normalizeName(e.name));
  const toggleDish = (e: CatalogEntry) =>
    setSelected((prev) => {
      const next = new Map(prev);
      const key = normalizeName(e.name);
      if (next.has(key)) next.delete(key);
      else next.set(key, e);
      return next;
    });

  const addAllInGroup = (cat: DishCategory) =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const e of grouped[cat]) next.set(normalizeName(e.name), e);
      return next;
    });
  const clearGroup = (cat: DishCategory) =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const e of grouped[cat]) next.delete(normalizeName(e.name));
      return next;
    });

  const addOwn = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const match = matchCatalogDish(trimmed);
    const entry: CatalogEntry =
      match ?? {
        continent: '',
        country: 'Custom',
        region: 'Custom',
        name: trimmed,
        cuisineTag: 'Other',
        diet: 'veg',
        category: 'main',
      };
    setSelected((prev) => new Map(prev).set(normalizeName(entry.name), entry));
    setOwnName('');
  };

  // Move from country step → region step (if needed) → dishes step, pre-ticking
  // a balanced starter set the first time dishes are shown.
  const goToDishes = () => {
    const picks = pickStarterDishes({
      countries,
      regions: regions.length ? regions : undefined,
      diet,
      limit: DEFAULT_PICK_LIMIT,
    });
    const m = new Map<string, CatalogEntry>();
    for (const e of picks) {
      const key = normalizeName(e.name);
      if (!existingSet.has(key)) m.set(key, e);
    }
    setSelected(m);
    setStep('dishes');
  };

  const handleContinueCountries = () => {
    if (countries.length === 0) return;
    // Default every multi-region country's regions ON, so nothing is hidden
    // unless the user narrows it themselves.
    if (multiRegionCountries.length > 0) {
      const all = multiRegionCountries.flatMap((c) => regionsForCountry(c));
      setRegions(all);
      setStep('regions');
    } else {
      setRegions([]);
      goToDishes();
    }
  };

  const selectedEntries = useMemo(() => Array.from(selected.values()), [selected]);
  const count = selected.size;

  const ownSuggestions = useMemo(
    () => suggestCatalogDishes(ownName, 6).map((e) => e.name),
    [ownName],
  );

  // ─────────────────────────────── Country step ───────────────────────────
  if (step === 'countries') {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>
            {mode === 'onboarding' ? 'Fill your kitchen' : 'Explore dishes'}
          </Text>
          <Text style={styles.subtitle}>
            Pick the cuisines your family eats — we’ll suggest dishes so you’re not
            starting from a blank page. You can always add your own.
          </Text>

          <Text style={styles.sectionLabel}>Diet</Text>
          <View style={styles.chipsRow}>
            {(['both', 'veg'] as DietPreference[]).map((d) => {
              const on = diet === d;
              return (
                <Chip
                  key={d}
                  selected={on}
                  onPress={() => setDiet(d)}
                  style={[styles.chip, on && styles.chipSelected]}
                  textStyle={[styles.chipText, on && styles.chipTextSelected]}
                >
                  {d === 'veg' ? 'Vegetarian only' : 'Everything'}
                </Chip>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Cuisines / countries</Text>
          <TextInput
            value={countrySearch}
            onChangeText={setCountrySearch}
            placeholder="Search countries"
            mode="outlined"
            dense
            style={styles.search}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="magnify" />}
          />
          <View style={styles.chipsRow}>
            {orderedCountries.map((c) => {
              const on = countries.includes(c);
              return (
                <Chip
                  key={c}
                  selected={on}
                  onPress={() => toggleCountry(c)}
                  style={[styles.chip, on && styles.chipSelected]}
                  textStyle={[styles.chipText, on && styles.chipTextSelected]}
                >
                  {c}
                </Chip>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerHint}>
            {countries.length
              ? `${countries.length} selected`
              : 'Select at least one'}
          </Text>
          <View style={styles.footerButtons}>
            {onSkip && (
              <Button mode="text" onPress={onSkip} textColor={colors.textSecondary}>
                {mode === 'onboarding' ? 'Skip for now' : 'Cancel'}
              </Button>
            )}
            <Button
              mode="contained"
              onPress={handleContinueCountries}
              disabled={countries.length === 0}
              buttonColor={colors.primary}
              style={styles.primaryBtn}
            >
              Continue
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────── Region step ────────────────────────────
  if (step === 'regions') {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Regions</Text>
          <Text style={styles.subtitle}>
            Some cuisines vary a lot by region. Keep them all, or narrow to what
            your family cooks.
          </Text>
          {multiRegionCountries.map((c) => {
            const rs = regionsForCountry(c);
            return (
              <View key={c} style={styles.regionBlock}>
                <Text style={styles.sectionLabel}>{c}</Text>
                <View style={styles.chipsRow}>
                  {rs.map((r) => {
                    const on = regions.includes(r);
                    return (
                      <Chip
                        key={r}
                        selected={on}
                        onPress={() => toggleRegion(r)}
                        style={[styles.chip, on && styles.chipSelected]}
                        textStyle={[styles.chipText, on && styles.chipTextSelected]}
                      >
                        {r}
                      </Chip>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <Button mode="text" onPress={() => setStep('countries')} textColor={colors.textSecondary}>
              Back
            </Button>
            <Button
              mode="contained"
              onPress={goToDishes}
              buttonColor={colors.primary}
              style={styles.primaryBtn}
            >
              Continue
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────── Dishes step ────────────────────────────
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Pick your dishes</Text>
        <Text style={styles.subtitle}>
          We’ve pre-selected a balanced starter set. Tap to add or remove — nothing
          is locked in until you tap the button below.
        </Text>

        {/* Add your own */}
        <View style={styles.ownRow}>
          <View style={styles.ownInputWrap}>
            <TextInput
              value={ownName}
              onChangeText={setOwnName}
              placeholder="Add your own dish"
              mode="outlined"
              dense
              style={styles.search}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              onSubmitEditing={() => addOwn(ownName)}
              returnKeyType="done"
              left={<TextInput.Icon icon="plus" />}
            />
            {ownName.trim().length > 0 && ownSuggestions.length > 0 && (
              <View style={styles.dropdown}>
                {ownSuggestions.map((n) => (
                  <TouchableOpacity key={n} style={styles.dropdownItem} onPress={() => addOwn(n)}>
                    <Text style={styles.dropdownText}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (items.length === 0) return null;
          const expanded = expandedGroups[cat];
          const shown = expanded ? items : items.slice(0, GROUP_COLLAPSED);
          const selectedInGroup = items.filter(isSelected).length;
          return (
            <View key={cat} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>
                  {CATEGORY_LABEL[cat]}{' '}
                  <Text style={styles.groupCount}>
                    {selectedInGroup}/{items.length}
                  </Text>
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    selectedInGroup === items.length ? clearGroup(cat) : addAllInGroup(cat)
                  }
                >
                  <Text style={styles.groupAction}>
                    {selectedInGroup === items.length ? 'Clear' : 'Add all'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsRow}>
                {shown.map((e) => {
                  const on = isSelected(e);
                  return (
                    <Chip
                      key={normalizeName(e.name)}
                      selected={on}
                      onPress={() => toggleDish(e)}
                      style={[styles.chip, on && styles.chipSelected]}
                      textStyle={[styles.chipText, on && styles.chipTextSelected]}
                    >
                      {e.name}
                    </Chip>
                  );
                })}
              </View>
              {items.length > GROUP_COLLAPSED && (
                <TouchableOpacity
                  onPress={() => setExpandedGroups((p) => ({ ...p, [cat]: !expanded }))}
                >
                  <Text style={styles.showMore}>
                    {expanded ? 'Show less' : `Show ${items.length - GROUP_COLLAPSED} more`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <Button mode="text" onPress={() => setStep('countries')} textColor={colors.textSecondary}>
            Back
          </Button>
          <Button
            mode="contained"
            onPress={() => onCommit(selectedEntries)}
            loading={committing}
            disabled={committing || count === 0}
            buttonColor={colors.primary}
            style={styles.primaryBtn}
            icon="silverware-fork-knife"
          >
            {count > 0 ? `Add these ${count}` : 'Pick some dishes'}
          </Button>
        </View>
      </View>
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.lg, paddingBottom: Spacing.xl },
    title: {
      fontSize: FontSize.xxl,
      fontFamily: Fonts.display,
      color: c.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.body,
      color: c.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.lg,
    },
    sectionLabel: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.textSecondary,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    search: { backgroundColor: c.surface, marginBottom: Spacing.sm },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
    },
    chip: { backgroundColor: c.surfaceVariant },
    chipSelected: { backgroundColor: c.primary },
    chipText: { fontSize: FontSize.sm, fontFamily: Fonts.bodyMedium, color: c.text },
    chipTextSelected: { color: c.white },
    regionBlock: { marginBottom: Spacing.sm },
    group: { marginTop: Spacing.md },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    groupTitle: { fontSize: FontSize.md, fontFamily: Fonts.displayMedium, color: c.text },
    groupCount: { fontSize: FontSize.sm, fontFamily: Fonts.body, color: c.textSecondary },
    groupAction: { fontSize: FontSize.sm, fontFamily: Fonts.bodyMedium, color: c.primary },
    showMore: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.bodyMedium,
      color: c.primary,
      paddingVertical: Spacing.xs,
    },
    ownRow: { marginBottom: Spacing.xs, zIndex: 10 },
    ownInputWrap: {},
    dropdown: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      marginTop: -Spacing.xs,
    },
    dropdownItem: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    dropdownText: { fontSize: FontSize.md, fontFamily: Fonts.body, color: c.text },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.surface,
      padding: Spacing.md,
    },
    footerHint: {
      fontSize: FontSize.sm,
      fontFamily: Fonts.body,
      color: c.textSecondary,
      marginBottom: Spacing.xs,
      textAlign: 'right',
    },
    footerButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    primaryBtn: { borderRadius: BorderRadius.md },
  });

export default StarterDishPicker;
