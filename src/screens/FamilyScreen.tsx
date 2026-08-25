import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Modal } from 'react-native';
import { Text, Avatar, TextInput, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale, FadeSlideIn } from '../components/motion';
import { ShareAppCard } from '../components/ShareAppCard';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

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
      Alert.alert('Family switched', 'You’re now active in the new family.');
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

      {/* Switch to / join another family by code. */}
      <Text style={styles.sectionLabel}>Another family</Text>
      <View style={styles.card}>
        <PressableScale style={styles.navRow} onPress={() => setShowSwitch(true)}>
          <MaterialCommunityIcons name="home-switch-outline" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navText}>Switch or join a family</Text>
            <Text style={styles.navSub}>Enter another family’s code to become active there</Text>
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

      {/* Switch / join by code */}
      <Modal visible={showSwitch} transparent animationType="fade" onRequestClose={() => setShowSwitch(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Switch or join a family</Text>
            <Text style={styles.modalBody}>
              Enter another family’s code to become active there. You can switch back anytime
              with your current code — you’re only ever active in one family at a time.
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
