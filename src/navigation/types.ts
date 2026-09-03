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
  Insights: { range?: string } | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  DishLibrary:
    | {
        // Independent scoping dimensions (fixes the old overloaded params):
        //  - audience: which track's dishes ('family' default, or 'kids' tiffins)
        //  - view: the pill preset — This month / Show all / Favorites / stale
        // Each pill is self-sufficient and operates WITHIN the current audience,
        // so "Show all" in the kids context shows all KIDS dishes, not the whole
        // family library.
        audience?: 'family' | 'kids';
        view?: 'month' | 'all' | 'favorites' | 'stale';
        title?: string;
        // Insights drill-down: focus on a specific dish (or few) by name, with an
        // optional window so the count matches the period Insights was showing.
        focusNames?: string[];
        window?: { start: string; end: string; label?: string };
      }
    | undefined;
  Restaurants: undefined;
  // Grocery moved OFF the bottom bar (Option B IA) into the Home stack — reached
  // from a quick-entry card on Home rather than a permanent tab.
  Grocery: undefined;
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
