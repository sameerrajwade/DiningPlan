import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Modal, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { captureRef } from 'react-native-view-shot';
import RNShare from 'react-native-share';
import { WEBSITE_URL } from '../config/links';
import { Spacing, FontSize, BorderRadius, Fonts, makeElevation } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { useDishStore } from '../stores/useDishStore';
import { useMealStore } from '../stores/useMealStore';
import { getRestaurants, createDishPack } from '../services/firestore';
import { buildDishPack, generatePackCode } from '../utils/dishPack';
import type { DishPack } from '../types';

interface Props {
  visible: boolean;
  householdId: string;
  userId: string;
  householdName: string;
  onClose: () => void;
}

type Bucket = 'dishes' | 'kids' | 'restaurants';

// Fixed brand palette — the share card looks the same regardless of app theme.
const TERRA = '#C0532E';
const CREAM = '#FBF7F2';
const CREAM_DIM = 'rgba(251,247,242,0.82)';

// Share your COOKED footprint (meal-derived, see dishPack). The user picks which
// buckets to include (pre-ticked, buckets with nothing are disabled), confirms,
// then we create the pack and hand over a branded card image + the code.
export const DishShareModal: React.FC<Props> = ({ visible, householdId, userId, householdName, onClose }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const elevation = useMemo(() => makeElevation(isDark), [isDark]);
  const cardRef = useRef<View>(null);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pack, setPack] = useState<Omit<DishPack, 'createdAt'> | null>(null);
  const [selected, setSelected] = useState<Record<Bucket, boolean>>({ dishes: true, kids: true, restaurants: true });

  // Build the full pack (meal-derived) once when opened, so we can show the
  // per-bucket counts. The code is generated here and shown on the card; the
  // pack is only written to Firestore when the user actually shares.
  useEffect(() => {
    if (!visible || !householdId || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPack(null);
      try {
        await Promise.all([
          useDishStore.getState().fetchDishes(householdId),
          useMealStore.getState().fetchAllMeals(householdId),
        ]);
        const dishes = useDishStore.getState().dishes;
        const meals = useMealStore.getState().meals;
        const restaurants = await getRestaurants(householdId).catch(() => []);
        const built = buildDishPack({ code: generatePackCode(), userId, householdName, dishes, meals, restaurants });
        if (cancelled) return;
        setPack(built);
        // Pre-tick only buckets that have something to share.
        setSelected({
          dishes: built.dishes.length > 0,
          kids: built.kidsDishes.length > 0,
          restaurants: built.restaurants.length > 0,
        });
      } catch {
        if (!cancelled) setPack(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, householdId, userId, householdName]);

  const counts = {
    dishes: pack?.dishes.length ?? 0,
    kids: pack?.kidsDishes.length ?? 0,
    restaurants: pack?.restaurants.length ?? 0,
  };
  // What the card + message advertise = only ticked, non-empty buckets.
  const sel = {
    dishes: selected.dishes && counts.dishes > 0,
    kids: selected.kids && counts.kids > 0,
    restaurants: selected.restaurants && counts.restaurants > 0,
  };
  const summaryParts = [
    sel.dishes ? `${counts.dishes} ${counts.dishes === 1 ? 'dish' : 'dishes'}` : '',
    sel.kids ? `${counts.kids} kids ${counts.kids === 1 ? 'tiffin' : 'tiffins'}` : '',
    sel.restaurants ? `${counts.restaurants} ${counts.restaurants === 1 ? 'restaurant' : 'restaurants'}` : '',
  ].filter(Boolean);
  const nothingSelected = summaryParts.length === 0;

  const toggle = (b: Bucket) => setSelected((s) => ({ ...s, [b]: !s[b] }));

  const doShare = useCallback(async () => {
    if (!pack || nothingSelected || busy) return;
    setBusy(true);
    try {
      // Persist only the selected buckets (empty out the rest).
      const finalPack = {
        ...pack,
        dishes: sel.dishes ? pack.dishes : [],
        kidsDishes: sel.kids ? pack.kidsDishes : [],
        restaurants: sel.restaurants ? pack.restaurants : [],
      };
      await createDishPack(finalPack);
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      const fileUrl = uri.startsWith('file://') ? uri : `file://${uri}`;
      await RNShare.open({
        url: fileUrl,
        type: 'image/png',
        message:
          `I'm sharing my Sofra dish collection with you! (${summaryParts.join(' · ')})\n\n` +
          `In Sofra: Dish Library → Import a code, then enter:\n\n${pack.code}\n\n` +
          `Get Sofra free: ${WEBSITE_URL}`,
        failOnCancel: false,
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Could not share', e?.message ?? 'Something went wrong creating your dish pack.');
    } finally {
      setBusy(false);
    }
  }, [pack, sel, nothingSelected, busy, summaryParts, onClose]);

  const rows: { key: Bucket; label: string; icon: string; count: number }[] = [
    { key: 'dishes', label: 'All dishes', icon: 'silverware-fork-knife', count: counts.dishes },
    { key: 'kids', label: 'Kids tiffins', icon: 'emoticon-happy-outline', count: counts.kids },
    { key: 'restaurants', label: 'Restaurants', icon: 'store', count: counts.restaurants },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, elevation.e3]}>
          <Text style={styles.title}>Share your dishes</Text>
          <Text style={styles.subtitle}>
            Choose what to include. Only what your family has actually cooked and eaten is shared —
            never meals, ratings, or spend.
          </Text>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: Spacing.xl }} color={colors.primary} />
          ) : (
            <>
              {/* Bucket checklist */}
              <View style={styles.checkCard}>
                {rows.map((r, i) => {
                  const empty = r.count === 0;
                  const on = selected[r.key] && !empty;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => !empty && toggle(r.key)}
                      disabled={empty}
                      style={[styles.checkRow, i > 0 && styles.checkRowBorder]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on, disabled: empty }}
                      accessibilityLabel={`${r.label}, ${r.count} ${r.count === 1 ? 'item' : 'items'}`}
                    >
                      <MaterialCommunityIcons
                        name={on ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={22}
                        color={empty ? colors.textMuted : on ? colors.primary : colors.textSecondary}
                      />
                      <MaterialCommunityIcons name={r.icon as any} size={18} color={empty ? colors.textMuted : colors.textSecondary} />
                      <Text style={[styles.checkLabel, empty && { color: colors.textMuted }]}>{r.label}</Text>
                      <Text style={[styles.checkCount, empty && { color: colors.textMuted }]}>
                        {empty ? 'none yet' : r.count}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Branded card that gets captured + shared (shows the live selection). */}
              <View style={styles.cardWrap}>
                <View ref={cardRef} collapsable={false} style={styles.card}>
                  <View style={styles.brandRow}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={CREAM} />
                    <Text style={styles.brand}>Sofra</Text>
                  </View>
                  <Text style={styles.cardKicker}>Dish collection</Text>
                  <Text style={styles.code}>{pack?.code ?? '••••••'}</Text>
                  <Text style={styles.cardSummary}>
                    {nothingSelected ? 'Pick something to share' : summaryParts.join('  ·  ')}
                  </Text>
                  <View style={styles.divider} />
                  <Text style={styles.fromLine} numberOfLines={1}>
                    from {householdName}
                  </Text>
                  <Text style={styles.cta}>Dish Library → Import a code · sofra.savvylabs.dev</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.actions}>
            <Button mode="text" onPress={onClose} textColor={TERRA} disabled={busy}>
              Cancel
            </Button>
            <Button
              mode="contained"
              icon="share-variant"
              onPress={doShare}
              loading={busy}
              disabled={busy || loading || nothingSelected}
              buttonColor={TERRA}
              textColor={CREAM}
            >
              Share
            </Button>
          </View>
        </View>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Dismiss" />
      </View>
    </Modal>
  );
};

const makeStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    backdropTap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
    sheet: { width: 340, maxWidth: '100%', backgroundColor: c.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg },
    title: { fontFamily: Fonts.display, fontSize: FontSize.xl, color: c.text },
    subtitle: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 19, marginTop: Spacing.xs, marginBottom: Spacing.md },
    checkCard: {
      backgroundColor: c.surfaceVariant,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
    checkRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    checkLabel: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    checkCount: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: c.textSecondary },
    cardWrap: { alignItems: 'center', marginBottom: Spacing.md },
    card: {
      width: '100%',
      backgroundColor: TERRA,
      borderRadius: 20,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
    brand: { fontFamily: Fonts.display, fontSize: 20, color: CREAM, letterSpacing: 0.5 },
    cardKicker: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.xs, color: CREAM_DIM, textTransform: 'uppercase', letterSpacing: 1.5 },
    code: { fontFamily: Fonts.display, fontSize: 44, color: CREAM, letterSpacing: 6, marginTop: 4 },
    cardSummary: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: CREAM, textAlign: 'center', marginTop: Spacing.xs },
    divider: { height: 1, backgroundColor: 'rgba(251,247,242,0.25)', alignSelf: 'stretch', marginVertical: Spacing.md },
    fromLine: { fontFamily: Fonts.displayMedium, fontSize: FontSize.sm, color: CREAM_DIM },
    cta: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.xs, color: CREAM_DIM, marginTop: Spacing.xs, letterSpacing: 0.3, textAlign: 'center' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
  });

export default DishShareModal;
