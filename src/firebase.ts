import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

console.log("Firebase Module Loading...");

const config = firebaseConfig;
console.log("Config loaded:", !!config);

let firebaseApp;
try {
  if (!getApps().length) {
    firebaseApp = initializeApp(config);
    console.log("Firebase App Initialized");
  } else {
    firebaseApp = getApp();
    console.log("Firebase App Retrieved");
  }
} catch (e) {
  console.error("Firebase Init Error:", e);
  throw e;
}

export const db = getFirestore(firebaseApp, config.firestoreDatabaseId);
export const auth = getAuth(firebaseApp);

console.log("Firestore & Auth exports ready");

export async function getFirebase() {
  return { db, auth };
}
