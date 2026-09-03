import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Portal, Modal, Text, TextInput, Button, Checkbox, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors, makeElevation } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { DishPack, DishPackDish, DishPackRestaurant } from '../types';
import { getDishPack, createRestaurantIfMissing } from '../services/firestore';
import { useDishStore } from '../stores/useDishStore';
import { normalizePackCode, newPackDishes, packDishesToDishes } from '../utils/dishPack';
import { toTitleCase } from '../utils/text';

interface Props {
  visible: boolean;
  householdId: string;
  existingDishNames: string[];
  onClose: () => void;
  onImported?: () => void;
}

// Enter a share code → review what's in the pack (pre-ticked, minus anything you
// already have) → import the selected dishes / kids tiffins / restaurant names.
export const DishPackImport: React.FC<Props> = ({
  visible,
  householdId,
  existingDishNames,
  onClose,
  onImported,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const elevation = useMemo(() => makeElevation(isDark), [isDark]);
  const addDishesBatch = useDishStore((s) => s.addDishesBatch);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pack, setPack] = useState<DishPack | null>(null);
  // selection sets keyed by lowercased name
  const [selDish, setSelDish] = useState<Set<string>>(new Set());
  const [selKid, setSelKid] = useState<Set<string>>(new Set());
  const [selRest, setSelRest] = useState<Set<string>>(new Set());

  const reset = () => {
    setCode(''); setPack(null); setLoading(false); setImporting(false);
    setSelDish(new Set()); setSelKid(new Set()); setSelRest(new Set());
  };
  const close = () => { reset(); onClose(); };

  // Only surface pack items the importer doesn't already have.
  const freshDishes = useMemo(
    () => (pack ? newPackDishes(pack.dishes, existingDishNames) : []),
    [pack, existingDishNames],
  );
  const freshKids = useMemo(
    () => (pack ? newPackDishes(pack.kidsDishes, existingDishNames) : []),
    [pack, existingDishNames],
  );

  const lookup = async () => {
    const c = normalizePackCode(code);
    if (c.length < 6) { Alert.alert('Enter a code', 'A share code is 6 characters.'); return; }
    setLoading(true);
    try {
      const found = await getDishPack(c);
      if (!found) {
        Alert.alert('Not found', 'No dish pack matches that code. Check it and try again.');
        return;
      }
      setPack(found);
      // Pre-tick everything new.
      setSelDish(new Set(newPackDishes(found.dishes, existingDishNames).map((d) => d.name.toLowerCase())));
      setSelKid(new Set(newPackDishes(found.kidsDishes, existingDishNames).map((d) => d.name.toLowerCase())));
      setSelRest(new Set(found.restaurants.map((r) => r.name.toLowerCase())));
    } catch {
      Alert.alert('Could not load', 'Something went wrong fetching that pack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setter(next);
  };

  const selectedCount = selDish.size + selKid.size + selRest.size;

  const doImport = async () => {
    if (!pack || selectedCount === 0) return;
    setImporting(true);
    try {
      const dishesToAdd: DishPackDish[] = [
        ...freshDishes.filter((d) => selDish.has(d.name.toLowerCase())),
        ...freshKids.filter((d) => selKid.has(d.name.toLowerCase())),
      ];
      let addedDishes = 0;
      if (dishesToAdd.length) {
        const ids = await addDishesBatch(householdId, packDishesToDishes(dishesToAdd, householdId));
        addedDishes = ids.length;
      }
      let addedRest = 0;
      const restToAdd = pack.restaurants.filter((r) => selRest.has(r.name.toLowerCase()));
      for (const r of restToAdd) {
        const created = await createRestaurantIfMissing(householdId, r.name, r.cuisineType).catch(() => false);
        if (created) addedRest++;
      }
      onImported?.();
      close();
      Alert.alert(
        'Imported',
        `Added ${addedDishes} ${addedDishes === 1 ? 'dish' : 'dishes'}` +
          (addedRest ? ` and ${addedRest} ${addedRest === 1 ? 'restaurant' : 'restaurants'}` : '') +
          ` from ${pack.householdName}.`,
      );
    } catch {
      Alert.alert('Import failed', 'Something went wrong importing. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const renderDishRow = (
    d: DishPackDish,
    set: Set<string>,
    setter: (s: Set<string>) => void,
  ) => {
    const key = d.name.toLowerCase();
    return (
      <View key={key} style={styles.row}>
        <Checkbox
          status={set.has(key) ? 'checked' : 'unchecked'}
          onPress={() => toggle(set, setter, key)}
          color={colors.primary}
          uncheckedColor={colors.textMuted}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowName}>{toTitleCase(d.name)}</Text>
          <Text style={styles.rowMeta}>
            {d.cuisineTag}
            {d.ingredients?.length ? ` · ${d.ingredients.length} ingredients` : ''}
            {d.recipe ? ' · recipe' : ''}
          </Text>
        </View>
      </View>
    );
  };

  const renderRestRow = (r: DishPackRestaurant) => {
    const key = r.name.toLowerCase();
    return (
      <View key={key} style={styles.row}>
        <Checkbox
          status={selRest.has(key) ? 'checked' : 'unchecked'}
          onPress={() => toggle(selRest, setSelRest, key)}
          color={colors.primary}
          uncheckedColor={colors.textMuted}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowName}>{r.name}</Text>
          <Text style={styles.rowMeta}>{r.cuisineType || 'Restaurant'}</Text>
        </View>
      </View>
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={close} contentContainerStyle={[styles.modal, elevation.e3]}>
        <View style={styles.header}>
          <Text style={styles.title}>{pack ? `From ${pack.householdName}` : 'Import dishes'}</Text>
          <IconButton icon="close" size={22} onPress={close} iconColor={colors.textSecondary} />
        </View>

        {!pack ? (
          <View>
            <Text style={styles.help}>
              Enter the 6-character code a friend or family member shared to bring their
              dishes into your library.
            </Text>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="Share code"
              mode="outlined"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              style={styles.codeInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <Button
              mode="contained"
              onPress={lookup}
              loading={loading}
              disabled={loading || code.trim().length < 6}
              buttonColor={colors.primary}
              style={styles.cta}
            >
              Look up pack
            </Button>
          </View>
        ) : (
          <View style={{ flexShrink: 1 }}>
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {freshDishes.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>Family dishes ({freshDishes.length})</Text>
                  {freshDishes.map((d) => renderDishRow(d, selDish, setSelDish))}
                </>
              )}
              {freshKids.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>Kids tiffins ({freshKids.length})</Text>
                  {freshKids.map((d) => renderDishRow(d, selKid, setSelKid))}
                </>
              )}
              {pack.restaurants.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>Restaurants ({pack.restaurants.length})</Text>
                  {pack.restaurants.map(renderRestRow)}
                </>
              )}
              {freshDishes.length === 0 && freshKids.length === 0 && pack.restaurants.length === 0 && (
                <Text style={styles.help}>
                  You already have everything in this pack — nothing new to import.
                </Text>
              )}
            </ScrollView>
            <Button
              mode="contained"
              onPress={doImport}
              loading={importing}
              disabled={importing || selectedCount === 0}
              buttonColor={colors.primary}
              style={styles.cta}
            >
              {selectedCount > 0 ? `Import ${selectedCount}` : 'Nothing selected'}
            </Button>
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
      padding: Spacing.lg,
      maxHeight: '82%',
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: Fonts.display, fontSize: FontSize.xl, color: c.text, flex: 1 },
    help: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
    codeInput: { backgroundColor: c.background, marginBottom: Spacing.md, letterSpacing: 2 },
    cta: { borderRadius: BorderRadius.md, marginTop: Spacing.sm },
    list: { marginTop: Spacing.xs },
    groupLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
    row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, paddingVertical: 2 },
    rowName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    rowMeta: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: c.textMuted, marginTop: 1 },
  });

export default DishPackImport;
