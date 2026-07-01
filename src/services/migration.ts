import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllMeals, updateMeal, getDishes, updateDish } from './firestore';
import { toTitleCase } from '../utils/text';

const MIGRATION_KEY = 'title_case_migration_v1';

export async function migrateDishNamesToTitleCase(householdId: string): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_KEY);
    if (done === 'done') return;

    const [meals, dishes] = await Promise.all([
      getAllMeals(householdId),
      getDishes(householdId),
    ]);

    const mealUpdates = meals
      .filter((m) => m.dishName && m.dishName !== toTitleCase(m.dishName))
      .map((m) => updateMeal(householdId, m.id, { dishName: toTitleCase(m.dishName) }).catch(() => {}));

    const dishUpdates = dishes
      .filter((d) => d.name && d.name !== toTitleCase(d.name))
      .map((d) => updateDish(householdId, d.id, { name: toTitleCase(d.name) }).catch(() => {}));

    await Promise.all([...mealUpdates, ...dishUpdates]);
    await AsyncStorage.setItem(MIGRATION_KEY, 'done');
  } catch {
    // Non-critical: skip migration on error
  }
}
