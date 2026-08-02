// Firestore rejects `undefined` field values ANYWHERE in a document — including
// nested inside arrays and maps (e.g. a meal's `items: [{ name, rating: undefined }]`).
// `stripUndefined` recurses so no `undefined` can ever reach a write, while leaving
// Date/Timestamp and other non-plain values (e.g. FieldValue sentinels) untouched.
//
// This is the single choke-point for all Firestore writes — every addDoc/setDoc/
// updateDoc payload should pass through it. Keep it dependency-free so it can be
// unit-tested without loading the Firebase SDK.
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    // Only recurse into PLAIN objects. Class instances (Date, Firestore
    // Timestamp, FieldValue sentinels) must pass through verbatim, or we'd
    // rebuild them into broken plain objects.
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}
