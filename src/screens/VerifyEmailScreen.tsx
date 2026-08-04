import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, HelperText } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../stores/useAuthStore';

// Gate shown to email/password accounts that haven't confirmed their address.
// Firebase sends a verification LINK (Path A); the user opens it, then taps
// "I've verified" here — we reload the Firebase user and, if verified, the app
// navigator routes forward automatically.
export const VerifyEmailScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user, resendVerification, refreshEmailVerified, signOut } = useAuthStore();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleCheck = useCallback(async () => {
    setChecking(true);
    setNotice(null);
    try {
      const verified = await refreshEmailVerified();
      if (!verified) {
        setIsError(true);
        setNotice("Not verified yet. Open the link in your email (check spam), then try again.");
      }
      // If verified, the navigator swaps this screen out on the next render.
    } catch {
      setIsError(true);
      setNotice('Could not check right now. Please try again.');
    } finally {
      setChecking(false);
    }
  }, [refreshEmailVerified]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setNotice(null);
    try {
      await resendVerification();
      setIsError(false);
      setNotice('Verification email sent. Check your inbox (and spam).');
    } catch {
      setIsError(true);
      setNotice('Too many attempts. Wait a minute, then try again.');
    } finally {
      setResending(false);
    }
  }, [resendVerification]);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="email-check-outline" size={44} color={colors.white} />
      </View>

      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.body}>
        We sent a verification link to{'\n'}
        <Text style={styles.email}>{user?.email ?? 'your email'}</Text>.
      </Text>
      <Text style={styles.body}>
        Open it to confirm your address, then come back and tap the button below.
      </Text>

      {notice ? (
        <HelperText type={isError ? 'error' : 'info'} visible style={styles.notice}>
          {notice}
        </HelperText>
      ) : null}

      <Button
        mode="contained"
        onPress={handleCheck}
        loading={checking}
        disabled={checking || resending}
        style={styles.primaryButton}
        buttonColor={colors.primary}
        textColor={colors.white}
        contentStyle={styles.buttonContent}
      >
        I've verified my email
      </Button>

      <Button
        mode="text"
        onPress={handleResend}
        loading={resending}
        disabled={checking || resending}
        textColor={colors.primary}
        style={styles.secondaryButton}
      >
        Resend email
      </Button>

      <Button
        mode="text"
        onPress={signOut}
        disabled={checking || resending}
        textColor={colors.textMuted}
        style={styles.secondaryButton}
      >
        Use a different account
      </Button>
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: FontSize.xxl,
      fontFamily: Fonts.display,
      color: c.text,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    body: {
      fontSize: FontSize.md,
      fontFamily: Fonts.body,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
      lineHeight: 22,
    },
    email: {
      fontFamily: Fonts.bodySemiBold,
      color: c.text,
    },
    notice: {
      fontSize: FontSize.sm,
      textAlign: 'center',
    },
    primaryButton: {
      alignSelf: 'stretch',
      marginTop: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    buttonContent: {
      paddingVertical: Spacing.xs,
    },
    secondaryButton: {
      marginTop: Spacing.xs,
    },
  });

export default VerifyEmailScreen;
