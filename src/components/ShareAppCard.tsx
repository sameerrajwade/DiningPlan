import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Modal, Share, Alert, Pressable } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Spacing, FontSize, BorderRadius, Fonts } from '../config/theme';
import { APP_STORE_URL, PLAY_STORE_URL } from '../config/links';

interface Props {
  visible: boolean;
  code: string | null; // family invite code
  onClose: () => void;
}

// Fixed brand palette so the shared card looks identical regardless of app theme.
const TERRA = '#C0532E';
const CREAM = '#FBF7F2';
const CREAM_DIM = 'rgba(251,247,242,0.82)';

// A branded, shareable image inviting someone to Sofra: brand + tagline + the
// family code + both app stores. The captured PNG carries the visuals; the OS
// share message carries the tappable store links + code (a link baked into an
// image isn't clickable, so we send both).
export const ShareAppCard: React.FC<Props> = ({ visible, code, onClose }) => {
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const shareMessage =
    `Join our family on Sofra — our shared meal memory 🍽️\n\n` +
    (code ? `Family code: ${code}\n\n` : '') +
    `Download Sofra (free):\n` +
    `iPhone: ${APP_STORE_URL}\n` +
    `Android: ${PLAY_STORE_URL}` +
    (code ? `\n\nAfter installing, enter the family code above when you sign up.` : '');

  const doShare = useCallback(async () => {
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      // Send the PNG + the message text together so recipients get the branded
      // card AND tappable store links. expo-sharing carries the image on both
      // platforms; RN Share is the fallback.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Share Sofra',
        });
        // expo-sharing sends only the file; follow with a text share so the
        // links are available too (some targets take the image, some the text).
        await Share.share({ message: shareMessage }).catch(() => {});
      } else {
        await Share.share({ url: uri, message: shareMessage });
      }
    } catch {
      // Fall back to a plain text invite so sharing never hard-fails.
      await Share.share({ message: shareMessage }).catch(() => {});
    } finally {
      setBusy(false);
    }
  }, [shareMessage]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Captured card */}
          <View ref={cardRef} collapsable={false} style={styles.card}>
            <View style={styles.brandRow}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={CREAM} />
              <Text style={styles.brand}>Sofra</Text>
              <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={CREAM} />
            </View>
            <Text style={styles.tagline}>Your family’s meal memory</Text>

            {code ? (
              <View style={styles.codeBlock}>
                <Text style={styles.codeLabel}>FAMILY CODE</Text>
                <Text style={styles.code}>{code}</Text>
                <Text style={styles.codeHint}>Enter this when you sign up</Text>
              </View>
            ) : null}

            <View style={styles.divider} />
            <Text style={styles.getLabel}>Download free</Text>
            <View style={styles.stores}>
              <View style={styles.storeRow}>
                <MaterialCommunityIcons name="apple" size={20} color={CREAM} />
                <Text style={styles.storeText}>App Store</Text>
              </View>
              <View style={styles.storeRow}>
                <MaterialCommunityIcons name="google-play" size={18} color={CREAM} />
                <Text style={styles.storeText}>Google Play</Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button mode="text" onPress={onClose} textColor={TERRA} disabled={busy}>
              Close
            </Button>
            <Button
              mode="contained"
              icon="share-variant"
              onPress={doShare}
              loading={busy}
              disabled={busy}
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

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  backdropTap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
  sheet: { width: 320, alignItems: 'stretch' },
  card: {
    backgroundColor: TERRA,
    borderRadius: 24,
    paddingVertical: Spacing.xl + Spacing.sm,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontFamily: Fonts.display, fontSize: 26, color: CREAM, letterSpacing: 0.5 },
  tagline: { fontFamily: Fonts.displayMedium, fontSize: FontSize.sm, color: CREAM_DIM, marginTop: 4 },
  codeBlock: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(251,247,242,0.35)',
  },
  codeLabel: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: CREAM_DIM, letterSpacing: 1.5 },
  code: { fontFamily: Fonts.display, fontSize: 34, color: CREAM, letterSpacing: 3, marginTop: 2 },
  codeHint: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: CREAM_DIM, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(251,247,242,0.25)', alignSelf: 'stretch', marginVertical: Spacing.lg },
  getLabel: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.xs, color: CREAM_DIM, letterSpacing: 0.5, textTransform: 'uppercase' },
  stores: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: CREAM },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: CREAM,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});

export default ShareAppCard;
