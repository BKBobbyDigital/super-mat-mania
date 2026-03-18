import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyATKr7LoBd4T4l93xi3VAOzfZcMdZG-mmo",
  authDomain: "super-mat-mania.firebaseapp.com",
  databaseURL: "https://super-mat-mania-default-rtdb.firebaseio.com",
  projectId: "super-mat-mania",
  storageBucket: "super-mat-mania.firebasestorage.app",
  messagingSenderId: "811844011867",
  appId: "1:811844011867:web:33742dab39a640ce55fc7e",
};

let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.warn("Firebase init failed:", e.message);
}

export function saveResults(results) {
  if (!db) return Promise.resolve();
  return set(ref(db, "results"), results);
}

export function subscribeResults(callback) {
  if (!db) return () => {};
  const unsubscribe = onValue(
    ref(db, "results"),
    (snapshot) => callback(snapshot.val() || {}),
    (error) => console.warn("Firebase read error:", error.message)
  );
  return unsubscribe;
}
