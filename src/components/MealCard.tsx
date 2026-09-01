import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Card, Text, Portal, Modal } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Meal } from '../types';
import { Spacing, FontSize, BorderRadius, Fonts, ThemeColors } from '../config/theme';
import { useTheme } from '../hooks/useTheme';
import { sourceIcon, cuisineIcon } from '../utils/icons';
import { mealDiet } from '../utils/diet';
import { recipeIcon } from '../utils/recipe';
import { useDishStore } from '../stores/useDishStore';
import { VegMark } from './VegMark';

// Translucent tint of an accent hex, for the food thumbnail.
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${alpha})`;
}

interface MealCardProps {
  meal: Meal | null;
  onPress?: () => void;
  placeholder?: string;
}

const sourceColor = (c: ThemeColors, type: string) => {
  switch (type) {
    case 'home':
      return c.home;
    case 'takeout':
      return c.takeout;
    case 'dineout':
      return c.dineout;
    default:
      return c.textSecondary;
  }
};
const sourceLabel = (type: string) => {
  switch (type) {
    case 'home':
      return 'Home';
    case 'takeout':
      return 'Takeout';
    case 'dineout':
      return 'Dine Out';
    default:
      return type;
  }
};

// Append T00:00:00 so parseISO treats it as local midnight, not UTC midnight
const getDaysAgo = (dateStr: string): number | null => {
  try {
    return differenceInCalendarDays(new Date(), parseISO(dateStr + 'T00:00:00'));
  } catch {
    return null;
  }
};

export const MealCard: React.FC<MealCardProps> = ({ meal, onPress, placeholder }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Surface a home dish's recipe right on the card (link/video → tap opens it),
  // without changing the card's height — it sits on the existing meta line.
  const dishes = useDishStore((s) => s.dishes);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const dishRecipe = useMemo(() => {
    if (!meal || meal.sourceType !== 'home' || !meal.dishName) return null;
    const d = dishes.find((x) => x.name.toLowerCase() === meal.dishName.toLowerCase());
    return d?.recipe ?? null;
  }, [dishes, meal]);
  // One simple "Recipe" pill: a link opens (YouTube app / browser), typed steps
  // open in a text box. Shown whenever a recipe exists, regardless of type.
  const onRecipePress = async () => {
    if (!dishRecipe) return;
    if (dishRecipe.type === 'text') {
      setRecipeModalOpen(true);
      return;
    }
    try {
      const ok = await Linking.canOpenURL(dishRecipe.value);
      if (ok) await Linking.openURL(dishRecipe.value);
    } catch {
      // ignore — best-effort open
    }
  };

  if (!meal) {
    return (
      <Card style={styles.card} onPress={onPress} accessibilityLabel={placeholder ?? 'No meal planned'}>
        <Card.Content style={styles.placeholderContent}>
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <MaterialCommunityIcons name="plus" size={20} color={colors.textMuted} />
          </View>
          <Text style={styles.placeholderText}>{placeholder ?? 'No meal planned'}</Text>
        </Card.Content>
      </Card>
    );
  }

  const daysAgo = getDaysAgo(meal.date);
  const chipColor = sourceColor(colors, meal.sourceType);
  const chipLabel = sourceLabel(meal.sourceType);
  const isOutside = meal.sourceType !== 'home';
  // For an outside meal, the restaurant is what you "ate" that slot — surface it
  // as the title, with the dishes you ordered on the line below.
  const title = isOutside && meal.restaurantName ? meal.restaurantName : meal.dishName;
  // Dishes ordered at the restaurant (all items, or the single dish if it isn't
  // just the restaurant-name fallback).
  const orderedDishes = isOutside
    ? (meal.items?.length
        ? meal.items.map((it) => it.name).filter(Boolean)
        : meal.dishName && meal.dishName !== title
          ? [meal.dishName]
          : [])
    : [];
  // Additional dishes beyond the primary (items[0] is the primary/summary dish).
  const extraDishes =
    meal.items && meal.items.length > 1
      ? meal.items.slice(1).map((it) => it.name).filter(Boolean)
      : [];

  return (
    <>
    <Card style={styles.card} onPress={onPress} accessibilityLabel={`${meal.dishName}, ${chipLabel}`}>
      <Card.Content style={styles.content}>
        {/* Cuisine-tinted food thumbnail — food is the product */}
        <View style={[styles.thumb, { backgroundColor: withAlpha(chipColor, 0.14) }]}>
          <MaterialCommunityIcons name={cuisineIcon(meal.cuisineTag) as any} size={22} color={chipColor} />
        </View>
        <View style={styles.textCol}>
          <View style={styles.row}>
            <VegMark diet={mealDiet(meal)} size={14} />
            <Text style={styles.dishName} numberOfLines={1}>
              {title}
            </Text>
            <View style={[styles.pill, { backgroundColor: chipColor }]}>
              <MaterialCommunityIcons name={sourceIcon(meal.sourceType) as any} size={12} color={colors.white} />
              <Text style={styles.pillText} accessibilityLabel={`Source: ${chipLabel}`}>
                {chipLabel}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {isOutside && orderedDishes.length > 0 ? (
              <Text
                style={styles.metaText}
                numberOfLines={2}
                accessibilityLabel={`Ordered ${orderedDishes.join(', ')}`}
              >
                {orderedDishes.join(' · ')}
              </Text>
            ) : !isOutside && extraDishes.length > 0 ? (
              <Text
                style={styles.metaText}
                numberOfLines={2}
                accessibilityLabel={`With ${extraDishes.join(', ')}`}
              >
                {extraDishes.join(' · ')}
              </Text>
            ) : daysAgo !== null && daysAgo > 0 ? (
              <Text style={styles.metaText} accessibilityLabel={`Last made ${daysAgo} days ago`}>
                Last made {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
              </Text>
            ) : null}
            {dishRecipe && (
              <TouchableOpacity
                onPress={onRecipePress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.recipeBtn}
                accessibilityLabel="Open recipe"
              >
                <MaterialCommunityIcons name={recipeIcon(dishRecipe.type) as any} size={15} color={colors.primary} />
                <Text style={styles.recipeBtnText}>Recipe</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
    {dishRecipe?.type === 'text' && (
      <Portal>
        <Modal
          visible={recipeModalOpen}
          onDismiss={() => setRecipeModalOpen(false)}
          contentContainerStyle={styles.recipeModal}
        >
          <Text style={styles.recipeModalTitle}>{meal.dishName} — recipe</Text>
          <ScrollView style={styles.recipeModalScroll}>
            <Text style={styles.recipeModalText}>{dishRecipe.value}</Text>
          </ScrollView>
        </Modal>
      </Portal>
    )}
    </>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.md,
      marginVertical: Spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      shadowColor: c.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 1,
    },
    content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    textCol: { flex: 1 },
    thumb: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbEmpty: {
      backgroundColor: c.surfaceVariant,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderStyle: 'dashed',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
    dishName: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSize.md,
      color: c.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      alignSelf: 'center',
    },
    pillText: { color: c.white, fontSize: FontSize.xs, fontFamily: Fonts.bodySemiBold },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs, gap: Spacing.sm },
    metaText: { flex: 1, fontFamily: Fonts.body, fontSize: FontSize.sm, color: c.textSecondary },
    recipeBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    recipeBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: c.primary },
    recipeModal: {
      backgroundColor: c.surface,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      maxHeight: '70%',
    },
    recipeModalTitle: { fontFamily: Fonts.display, fontSize: FontSize.lg, color: c.text, marginBottom: Spacing.sm },
    recipeModalScroll: { maxHeight: 360 },
    recipeModalText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.text, lineHeight: 22 },
    placeholderContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    placeholderText: { fontFamily: Fonts.body, fontSize: FontSize.md, color: c.textMuted },
  });

export default MealCard;
