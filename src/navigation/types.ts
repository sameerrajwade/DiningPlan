import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { Meal, MealType } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  VerifyEmail: undefined;
  HouseholdSetup: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  // `mealType` pre-selects the slot the user tapped (e.g. tapping "Dinner" on
  // Home) so the form doesn't default to Lunch and wrongly report a conflict.
  AddMeal: { meal?: Meal; mealType?: MealType } | undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  // `focusDate` (yyyy-MM-dd) scrolls to + highlights a day — used by the daily
  // reminder to open tomorrow's menu.
  Calendar: { focusDate?: string } | undefined;
  // `autoGenerate` makes Plan generate an (unsaved) plan on open — used by the
  // weekly reminder to show a fresh auto-plan.
  Plan: { autoGenerate?: boolean } | undefined;
  Grocery: undefined;
  Insights: { range?: string } | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  DishLibrary:
    | {
        monthDishes?: string[];
        title?: string;
        initialFilter?: 'all' | 'favorites' | 'stale';
        // When set, timesCooked / last-made are counted only within [start, end]
        // (inclusive, yyyy-MM-dd) so a scoped view ("this month", a range from
        // Insights) shows window counts, not the all-time total.
        window?: { start: string; end: string; label?: string };
      }
    | undefined;
  Restaurants: undefined;
  // `range` carries the time window selected on the Restaurants list so the
  // detail opens on the SAME period the user was looking at (This month → This
  // month, etc.) instead of jumping to all-time.
  RestaurantDetail: { name: string; range?: RestaurantRange };
  History: undefined;
};

// Shared time windows for the Restaurants list and a restaurant's detail, so the
// two always agree on what "This month" means.
export type RestaurantRange = 'month' | 'lastMonth' | '3months' | 'all';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Family: undefined;
  Settings: undefined;
  Legal: { doc: 'privacy' | 'terms' };
};

// Screen prop helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList, 'Home'>,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList, 'Profile'>,
      NativeStackScreenProps<RootStackParamList>
    >
  >;
