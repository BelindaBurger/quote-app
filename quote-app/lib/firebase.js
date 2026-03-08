// lib/firebase.js
// ─────────────────────────────────────────────────────────────
// STEP 1: Replace the values below with your own Firebase config.
// Get them from: https://console.firebase.google.com
//   → Your project → Project Settings → "Your apps" → Web app
// ─────────────────────────────────────────────────────────────

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey:            "AIzaSyAsagPE9bE2ggfKpdkr3oPCc1KH7v08ROM",
  authDomain:        "quote-app-919e2.firebaseapp.com",
  projectId:         "quote-app-919e2",
  storageBucket:     "quote-app-919e2.firebasestorage.app",
  messagingSenderId: "285823639539",
  appId:             "1:285823639539:web:bafdd579b46e32448dbc86",
};

// Prevent re-initialisation on hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);
const storage = getStorage(app);

// ─── Save a new quote ────────────────────────────────────────
export async function saveQuote({ id, clientName, quoteRef, fileName, pdfBase64 }) {
  // 1. Upload PDF to Firebase Storage
  const storageRef = ref(storage, `quotes/${id}/${fileName}`);
  await uploadString(storageRef, pdfBase64, "data_url");
  const pdfUrl = await getDownloadURL(storageRef);

  // 2. Save metadata to Firestore
  await setDoc(doc(db, "quotes", id), {
    id,
    clientName,
    quoteRef,
    fileName,
    pdfUrl,
    status: "pending",
    createdAt: serverTimestamp(),
    acceptedAt: null,
    acceptedByName: null,
  });

  return pdfUrl;
}

// ─── Load a single quote ─────────────────────────────────────
export async function loadQuote(id) {
  const snap = await getDoc(doc(db, "quotes", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
    acceptedAt: d.acceptedAt?.toMillis?.() ?? null,
  };
}

// ─── List all quotes ─────────────────────────────────────────
export async function listQuotes() {
  const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      acceptedAt: data.acceptedAt?.toMillis?.() ?? null,
    };
  });
}

// ─── Accept or decline a quote ───────────────────────────────
export async function respondToQuote(id, status, acceptedByName = "") {
  await updateDoc(doc(db, "quotes", id), {
    status,
    acceptedByName: acceptedByName || null,
    acceptedAt: serverTimestamp(),
  });
}
