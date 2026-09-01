import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Modal, Share } from 'react-native';
import { Text, Avatar, TextInput, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale, FadeSlideIn } from '../components/motion';
import { ShareAppCard } from '../components/ShareAppCard';
import { DishPackImport } from '../components/DishPackImport';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useDishStore } from '../stores/useDishStore';
import { useMealStore } from '../stores/useMealStore';
import { getRestaurants, createDishPack } from '../services/firestore';
import { buildDishPack, generatePackCode } from '../utils/dishPack';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const FamilyScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuthStore();
  const { household, members, fetchMembers, switchHousehold } = useHouseholdStore();
  const householdId = user?.householdId ?? '';

  const [showShare, setShowShare] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchCode, setSwitchCode] = useState('');
  const [switching, setSwitching] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [sharingDishes, setSharingDishes] = useState(false);

  // Select the STABLE dishes array, then derive names with useMemo. Mapping
  // inside the selector returns a new array every render, which makes Zustand's
  // useSyncExternalStore see a changed snapshot each time → infinite re-render.
  const dishes = useDishStore((s) => s.dishes);
  const dishNames = useMemo(() => dishes.map((d) => d.name), [dishes]);

  // Build a shareable dish pack (definitions only — no meals/ratings/spend) and
  // hand the code to the OS share sheet. Loads dishes/meals/restaurants fresh so
  // the pack reflects the full library even if this tab hasn't loaded them yet.
  const handleShareDishes = useCallback(async () => {
    if (!householdId || !user || sharingDishes) return;
    setSharingDishes(true);
    try {
      await Promise.all([
        useDishStore.getState().fetchDishes(householdId),
        useMealStore.getState().fetchAllMeals(householdId),
      ]);
      const dishes = useDishStore.getState().dishes;
      const meals = useMealStore.getState().meals;
      if (dishes.length === 0) {
        Alert.alert('No dishes yet', 'Add some dishes to your library first, then share them.');
        return;
      }
      const restaurants = await getRestaurants(householdId).catch(() => []);
      const code = generatePackCode();
      const pack = buildDishPack({
        code,
        userId: user.id,
        householdName: household?.name ?? 'a Sofra family',
        dishes,
        meals,
        restaurants,
      });
      await createDishPack(pack);
      const counts = [
        `${pack.dishes.length} ${pack.dishes.length === 1 ? 'dish' : 'dishes'}`,
        pack.kidsDishes.length ? `${pack.kidsDishes.length} kids tiffins` : '',
        pack.restaurants.length ? `${pack.restaurants.length} restaurants` : '',
      ].filter(Boolean).join(', ');
      await Share.share({
        message:
          `I'm sharing my Sofra dish collection with you! (${counts})\n\n` +
          `In Sofra, go to Family → “Import dishes from a code” and enter:\n\n${code}\n\n` +
          `Sofra — your family's meal memory.`,
      });
    } catch (e: any) {
      Alert.alert('Could not share', e?.message ?? 'Something went wrong creating your dish pack.');
    } finally {
      setSharingDishes(false);
    }
  }, [householdId, user, household, sharingDishes]);

  useEffect(() => {
    if (householdId) fetchMembers(householdId).catch(() => {});
  }, [householdId, fetchMembers]);

  useFocusEffect(
    useCallback(() => {
      if (householdId) fetchMembers(householdId).catch(() => {});
    }, [householdId, fetchMembers]),
  );

  const handleSwitchSubmit = useCallback(async () => {
    const code = switchCode.trim();
    if (!code || !user) return;
    setSwitching(true);
    try {
      await switchHousehold(code, user.id);
      setShowSwitch(false);
      setSwitchCode('');
      Alert.alert('Home switched', 'You’re now in this home.');
    } catch (e: any) {
      Alert.alert('Couldn’t switch', e?.message ?? 'Check the code and try again.');
    } finally {
      setSwitching(false);
    }
  }, [switchCode, user, switchHousehold]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeSlideIn>
        <Text style={styles.sectionLabel}>
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </Text>
        <View style={styles.card}>
          {members.map((m, i) => (
            <View key={m.id} style={[styles.memberRow, i > 0 && styles.memberRowBorder]}>
              {m.avatarUrl ? (
                <Avatar.Image size={40} source={{ uri: m.avatarUrl }} />
              ) : (
                <Avatar.Text
                  size={40}
                  label={getInitials(m.name)}
                  style={{ backgroundColor: colors.home }}
                  labelStyle={{ color: colors.white }}
                />
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.name}</Text>
                <Text style={styles.memberRole}>
                  {m.id === household?.adminId ? 'Admin' : 'Member'}
                </Text>
              </View>
              {m.id === user?.id && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </FadeSlideIn>

      {/* Your family — name, invite code, and a branded share card. */}
      <Text style={styles.sectionLabel}>Your family</Text>
      <View style={styles.card}>
        {household?.name ? <Text style={styles.familyName}>{household.name}</Text> : null}
        {household?.inviteCode ? (
          <View style={styles.codeRow}>
            <View>
              <Text style={styles.codeLabel}>FAMILY CODE</Text>
              <Text style={styles.code}>{household.inviteCode}</Text>
            </View>
            <MaterialCommunityIcons name="account-multiple-plus-outline" size={26} color={colors.textMuted} />
          </View>
        ) : null}
        <PressableScale style={styles.shareBtn} onPress={() => setShowShare(true)}>
          <MaterialCommunityIcons name="share-variant" size={18} color={colors.white} />
          <Text style={styles.shareBtnText}>Share invite & app</Text>
        </PressableScale>
      </View>

      {/* Share your dish collection with another household, or import theirs. */}
      <Text style={styles.sectionLabel}>Share & import dishes</Text>
      <View style={styles.card}>
        <PressableScale style={styles.navRow} onPress={handleShareDishes} disabled={sharingDishes}>
          <MaterialCommunityIcons name="gift-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navText}>{sharingDishes ? 'Preparing your pack…' : 'Share your dishes'}</Text>
            <Text style={styles.navSub}>Send your dish collection to another family via a code</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </PressableScale>
        <View style={styles.rowDivider} />
        <PressableScale style={styles.navRow} onPress={() => setShowImport(true)}>
          <MaterialCommunityIcons name="import" size={22} color={colors.home} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navText}>Import dishes from a code</Text>
            <Text style={styles.navSub}>Bring another family's dishes into your library</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </PressableScale>
      </View>

      {/* Switch which home is active (a family can have more than one home code). */}
      <Text style={styles.sectionLabel}>Other homes</Text>
      <View style={styles.card}>
        <PressableScale style={styles.navRow} onPress={() => setShowSwitch(true)}>
          <MaterialCommunityIcons name="home-switch-outline" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navText}>Switch to another home</Text>
            <Text style={styles.navSub}>Have more than one home code? Choose the one to use</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </PressableScale>
      </View>

      <View style={{ height: Spacing.xxl }} />

      <ShareAppCard
        visible={showShare}
        code={household?.inviteCode ?? null}
        onClose={() => setShowShare(false)}
      />

      <DishPackImport
        visible={showImport}
        householdId={householdId}
        existingDishNames={dishNames}
        onClose={() => setShowImport(false)}
        onImported={() => { if (householdId) useDishStore.getState().fetchDishes(householdId, true); }}
      />

      {/* Switch / join by code */}
      <Modal visible={showSwitch} transparent animationType="fade" onRequestClose={() => setShowSwitch(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Switch to another home</Text>
            <Text style={styles.modalBody}>
              If your family uses more than one home code, enter the one you’d like to use.
              Sofra keeps you in a single home at a time, and you can switch back whenever you
              like — nothing is lost.
            </Text>
            <TextInput
              value={switchCode}
              onChangeText={(t) => setSwitchCode(t.toUpperCase())}
              mode="outlined"
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="Family code"
              style={styles.modalInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              accessibilityLabel="Family code"
            />
            <View style={styles.modalActions}>
              <Button
                mode="text"
                onPress={() => { setShowSwitch(false); setSwitchCode(''); }}
                textColor={colors.textSecondary}
                disabled={switching}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSwitchSubmit}
                loading={switching}
                disabled={switching || !switchCode.trim()}
                buttonColor={colors.primary}
                textColor={colors.white}
              >
                Switch
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.md },
    sectionLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: FontSize.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.sm,
      marginTop: Spacing.lg,
      marginLeft: Spacing.xs,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
    },
    memberRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    memberInfo: { flex: 1 },
    memberName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    memberRole: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary },
    youBadge: {
      backgroundColor: c.dineoutLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    youBadgeText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: c.primaryDark },
    familyName: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text, marginTop: Spacing.sm, marginBottom: Spacing.xs },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
    },
    codeLabel: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: c.textMuted, letterSpacing: 1 },
    code: { fontFamily: Fonts.display, fontSize: FontSize.xxl, color: c.primary, letterSpacing: 2, marginTop: 2 },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: c.primary,
    },
    shareBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.md, color: c.white },
    navRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
    rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    navText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.md, color: c.text },
    navSub: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    modalCard: { width: '100%', maxWidth: 360, backgroundColor: c.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg },
    modalTitle: { fontFamily: Fonts.display, fontSize: FontSize.xl, color: c.text, marginBottom: Spacing.sm },
    modalBody: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
    modalInput: { backgroundColor: c.surface, marginBottom: Spacing.md },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
  });

export default FamilyScreen;
