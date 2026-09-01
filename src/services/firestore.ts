import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Meal,
  Dish,
  Restaurant,
  Household,
  User,
  UserPreferences,
  GroceryItem,
  DishPack,
} from '../types';
import { stripUndefined } from '../utils/sanitize';

// ── Dish-pack sharing (Phase 4) ─────────────────────────────────────────────
// Top-level `dishPacks/{code}` docs hold shareable dish DEFINITIONS keyed by a
// short code (see utils/dishPack). Any signed-in user can read a pack by code
// (the code is the access token); only the creator can write it.
export async function createDishPack(pack: Omit<DishPack, 'createdAt'>): Promise<void> {
  await setDoc(doc(db, 'dishPacks', pack.code), stripUndefined({
    ...pack,
    createdAt: Timestamp.now(),
  }));
}

export async function getDishPack(code: string): Promise<DishPack | null> {
  const snap = await getDoc(doc(db, 'dishPacks', code));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...(d as DishPack),
    code: snap.id,
    createdAt: toDate(d.createdAt),
  };
}

// ─── Helpers ───

function mealsCol(householdId: string) {
  return collection(db, `households/${householdId}/meals`);
}
function dishesCol(householdId: string) {
  return collection(db, `households/${householdId}/dishes`);
}
function restaurantsCol(householdId: string) {
  return collection(db, `households/${householdId}/restaurants`);
}
function groceryCol(householdId: string) {
  return collection(db, `households/${householdId}/grocery`);
}

function toDate(ts: any): Date {
  return ts instanceof Timestamp ? ts.toDate() : new Date(ts);
}

function mealFromDoc(docSnap: any): Meal {
  const d = docSnap.data();
  return {
    ...d,
    id: docSnap.id,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as Meal;
}

// ─── Meals ───

export async function addMeal(
  householdId: string,
  meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(mealsCol(householdId), {
    ...stripUndefined(meal),
    householdId,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateMeal(
  householdId: string,
  mealId: string,
  data: Partial<Meal>,
): Promise<void> {
  const ref = doc(db, `households/${householdId}/meals`, mealId);
  await updateDoc(ref, { ...stripUndefined(data), updatedAt: Timestamp.now() });
}

export async function deleteMeal(
  householdId: string,
  mealId: string,
): Promise<void> {
  await deleteDoc(doc(db, `households/${householdId}/meals`, mealId));
}

export async function getMealsByDateRange(
  householdId: string,
  startDate: string,
  endDate: string,
): Promise<Meal[]> {
  const q = query(
    mealsCol(householdId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(mealFromDoc);
}

export async function getMealsByDate(
  householdId: string,
  date: string,
): Promise<Meal[]> {
  const q = query(mealsCol(householdId), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map(mealFromDoc);
}

export async function getMealsForMonth(
  householdId: string,
  year: number,
  month: number,
): Promise<Meal[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return getMealsByDateRange(householdId, start, end);
}

export async function getAllMeals(householdId: string): Promise<Meal[]> {
  const q = query(mealsCol(householdId), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(mealFromDoc);
}

// ─── Dishes ───

export async function addDish(
  householdId: string,
  dish: Omit<Dish, 'id'>,
): Promise<string> {
  const ref = await addDoc(dishesCol(householdId), stripUndefined({ ...dish, householdId }));
  return ref.id;
}

// Seed many dishes in a SINGLE atomic write (used by starter-catalog seeding and
// dish-pack import) instead of N round-trips. Returns the new document ids in the
// same order as the input. Firestore batches cap at 500 ops, so we chunk.
export async function addDishesBatch(
  householdId: string,
  dishes: Omit<Dish, 'id'>[],
): Promise<string[]> {
  const ids: string[] = [];
  const CHUNK = 450;
  for (let i = 0; i < dishes.length; i += CHUNK) {
    const batch = writeBatch(db);
    const slice = dishes.slice(i, i + CHUNK);
    for (const dish of slice) {
      const ref = doc(dishesCol(householdId));
      batch.set(ref, stripUndefined({ ...dish, householdId }));
      ids.push(ref.id);
    }
    await batch.commit();
  }
  return ids;
}

export async function updateDish(
  householdId: string,
  dishId: string,
  data: Partial<Dish>,
): Promise<void> {
  await updateDoc(doc(db, `households/${householdId}/dishes`, dishId), stripUndefined(data));
}

export async function getDishes(householdId: string): Promise<Dish[]> {
  const snap = await getDocs(dishesCol(householdId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Dish));
}

export async function getDishByName(
  householdId: string,
  name: string,
): Promise<Dish | null> {
  const q = query(dishesCol(householdId), where('name', '==', name));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data(), id: d.id } as Dish;
}

export async function incrementDishCount(
  householdId: string,
  dishId: string,
  date: string,
): Promise<void> {
  const ref = doc(db, `households/${householdId}/dishes`, dishId);
  await updateDoc(ref, {
    timesCooked: increment(1),
    lastCookedDate: date,
  });
}

// ─── Restaurants ───

export async function addOrUpdateRestaurant(
  householdId: string,
  name: string,
  cuisineType: string,
  spend: number,
  date: string,
): Promise<void> {
  const q = query(restaurantsCol(householdId), where('name', '==', name));
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(restaurantsCol(householdId), stripUndefined({
      name,
      cuisineType,
      totalVisits: 1,
      totalSpend: spend,
      lastVisitDate: date,
      householdId,
    }));
  } else {
    const existing = snap.docs[0];
    await updateDoc(existing.ref, stripUndefined({
      totalVisits: increment(1),
      totalSpend: increment(spend),
      lastVisitDate: date,
      cuisineType,
    }));
  }
}

export async function getRestaurants(householdId: string): Promise<Restaurant[]> {
  const snap = await getDocs(restaurantsCol(householdId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Restaurant));
}

// Create a restaurant NAME with no visit history (used by dish-pack import).
// Unlike addOrUpdateRestaurant this never fabricates a visit/spend — an imported
// place starts at zero until the household actually eats there. Skips if a
// restaurant with that name already exists. Returns true if it created one.
export async function createRestaurantIfMissing(
  householdId: string,
  name: string,
  cuisineType: string,
): Promise<boolean> {
  const existing = await getRestaurantByName(householdId, name);
  if (existing) return false;
  await addDoc(restaurantsCol(householdId), stripUndefined({
    name,
    cuisineType,
    totalVisits: 0,
    totalSpend: 0,
    lastVisitDate: '',
    householdId,
  }));
  return true;
}

export async function getRestaurantByName(
  householdId: string,
  name: string,
): Promise<Restaurant | null> {
  const q = query(restaurantsCol(householdId), where('name', '==', name));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data(), id: d.id } as Restaurant;
}

// Set a per-dish star rating for a restaurant (creates the doc if missing).
export async function setRestaurantDishRating(
  householdId: string,
  name: string,
  dishName: string,
  rating: number,
): Promise<void> {
  const q = query(restaurantsCol(householdId), where('name', '==', name));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(restaurantsCol(householdId), {
      name,
      cuisineType: '',
      totalVisits: 0,
      totalSpend: 0,
      lastVisitDate: '',
      householdId,
      dishRatings: { [dishName]: rating },
    });
    return;
  }
  const ref = snap.docs[0].ref;
  const existing = (snap.docs[0].data().dishRatings ?? {}) as Record<string, number>;
  await updateDoc(ref, { dishRatings: { ...existing, [dishName]: rating } });
}

// ─── Grocery (one shared household checklist) ───

function groceryFromDoc(docSnap: any): GroceryItem {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    text: d.text,
    checked: !!d.checked,
    source: d.source ?? 'manual',
    dishId: d.dishId,
    createdAt: toDate(d.createdAt),
    householdId: d.householdId,
  };
}

export async function getGroceryItems(householdId: string): Promise<GroceryItem[]> {
  const snap = await getDocs(groceryCol(householdId));
  return snap.docs
    .map(groceryFromDoc)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// Add several items in one atomic write. Caller is responsible for de-duplication
// (see utils/grocery.dedupeNewItems); this just persists. Returns the new items
// (with ids) so the store can update its cache without a re-read.
export async function addGroceryItems(
  householdId: string,
  items: { text: string; source: 'dish' | 'manual'; dishId?: string }[],
): Promise<GroceryItem[]> {
  const now = Timestamp.now();
  const batch = writeBatch(db);
  const created: GroceryItem[] = [];
  for (const it of items) {
    const ref = doc(groceryCol(householdId));
    const data = stripUndefined({
      text: it.text,
      checked: false,
      source: it.source,
      dishId: it.dishId,
      householdId,
      createdAt: now,
    });
    batch.set(ref, data);
    created.push({
      id: ref.id,
      text: it.text,
      checked: false,
      source: it.source,
      dishId: it.dishId,
      createdAt: now.toDate(),
      householdId,
    });
  }
  await batch.commit();
  return created;
}

export async function setGroceryChecked(
  householdId: string,
  itemId: string,
  checked: boolean,
): Promise<void> {
  await updateDoc(doc(db, `households/${householdId}/grocery`, itemId), { checked });
}

export async function deleteGroceryItem(
  householdId: string,
  itemId: string,
): Promise<void> {
  await deleteDoc(doc(db, `households/${householdId}/grocery`, itemId));
}

// Bulk delete (Clear checked / Clear all). Pass the ids to remove.
export async function deleteGroceryItems(
  householdId: string,
  itemIds: string[],
): Promise<void> {
  const CHUNK = 450;
  for (let i = 0; i < itemIds.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const id of itemIds.slice(i, i + CHUNK)) {
      batch.delete(doc(db, `households/${householdId}/grocery`, id));
    }
    await batch.commit();
  }
}

// ─── Households ───

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createHousehold(
  name: string,
  userId: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'households'), {
    name,
    memberIds: [userId],
    adminId: userId,
    inviteCode: generateInviteCode(),
    createdAt: Timestamp.now(),
  });
  await updateDoc(doc(db, 'users', userId), { householdId: ref.id });
  return ref.id;
}

export async function joinHousehold(
  inviteCode: string,
  userId: string,
): Promise<string> {
  const normalizedCode = inviteCode.trim().toUpperCase();
  const q = query(
    collection(db, 'households'),
    where('inviteCode', '==', normalizedCode),
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid invite code');

  const householdDoc = snap.docs[0];
  const data = householdDoc.data() as Household;
  if (data.memberIds.includes(userId)) {
    return householdDoc.id;
  }

  // Atomic add — a plain read-modify-write loses a member when two people join
  // on the same invite code concurrently (last write wins).
  await updateDoc(householdDoc.ref, { memberIds: arrayUnion(userId) });
  await setDoc(doc(db, 'users', userId), { householdId: householdDoc.id }, { merge: true });
  return householdDoc.id;
}

// Remove a user from their household's member list (used by leave + delete-account).
export async function leaveHousehold(
  householdId: string,
  userId: string,
): Promise<void> {
  const ref = doc(db, 'households', householdId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  // Atomic remove (avoids clobbering a concurrent membership change).
  await updateDoc(ref, { memberIds: arrayRemove(userId) });
}

// Delete the user's own profile doc + detach from household. Auth user is
// deleted separately (client-side) by deleteCurrentUser().
export async function deleteUserData(
  userId: string,
  householdId: string | null,
): Promise<void> {
  if (householdId) {
    await leaveHousehold(householdId, userId).catch(() => {});
  }
  // Delete the preferences sub-doc too — Firestore does not cascade, so it would
  // otherwise be orphaned.
  await deleteDoc(doc(db, 'users', userId, 'settings', 'preferences')).catch(() => {});
  await deleteDoc(doc(db, 'users', userId)).catch(() => {});
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  const snap = await getDoc(doc(db, 'households', householdId));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id } as Household;
}

export async function updateHousehold(
  householdId: string,
  data: Partial<Household>,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId), stripUndefined(data));
}

export async function getHouseholdMembers(householdId: string): Promise<User[]> {
  const household = await getHousehold(householdId);
  if (!household) return [];
  const members: User[] = [];
  for (const uid of household.memberIds) {
    // One unreadable/missing member must not fail the entire list
    const profile = await getUserProfile(uid).catch(() => null);
    if (profile) members.push(profile);
  }
  return members;
}

// ─── Users ───

export async function createUserProfile(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.id), stripUndefined({
    ...user,
    createdAt: Timestamp.now(),
  }));
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { ...d, id: snap.id, createdAt: toDate(d.createdAt) } as User;
}

export async function updateUserProfile(
  userId: string,
  data: Partial<User>,
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), stripUndefined(data));
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'settings', 'preferences'));
  if (!snap.exists()) return null;
  return snap.data() as UserPreferences;
}

export async function updateUserPreferences(
  userId: string,
  prefs: Partial<UserPreferences>,
): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), stripUndefined(prefs), {
    merge: true,
  });
}
