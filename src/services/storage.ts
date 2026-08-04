import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase';

// RN's New Architecture (Expo SDK 57 / RN 0.86) broke `fetch(uri).blob()`, and
// Firebase's `uploadString('base64')` also fails because it reconstructs a Blob
// from an ArrayBuffer — which React Native doesn't support. The one reliable way
// to get an uploadable Blob in RN is XHR with responseType 'blob': it returns a
// native-backed Blob that Firebase streams straight to the network layer.
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () =>
      reject(new Error(`Could not read the selected image (${uri}).`));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uploadProfilePicture(
  userId: string,
  uri: string,
  contentType: string = 'image/jpeg',
): Promise<string> {
  const blob = await uriToBlob(uri);
  try {
    const storageRef = ref(storage, `avatars/${userId}`);
    // Explicit contentType satisfies the Storage rule (must match image/.*).
    await uploadBytes(storageRef, blob, { contentType });
    return await getDownloadURL(storageRef);
  } finally {
    // RN Blobs hold a native reference — release it.
    (blob as unknown as { close?: () => void }).close?.();
  }
}

export async function deleteProfilePicture(userId: string): Promise<void> {
  const storageRef = ref(storage, `avatars/${userId}`);
  await deleteObject(storageRef);
}
