import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, serverTimestamp, orderBy, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyAsagPE9bE2ggfKpdkr3oPCc1KH7v08ROM",
  authDomain:        "quote-app-919e2.firebaseapp.com",
  projectId:         "quote-app-919e2",
  storageBucket:     "quote-app-919e2.firebasestorage.app",
  messagingSenderId: "285823639539",
  appId:             "1:285823639539:web:bafdd579b46e32448dbc86",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

export async function saveQuote({ id, clientName, quoteRef, fileName, pdfBase64 }) {
  await setDoc(doc(db, "quotes", id), {
    id, clientName, quoteRef, fileName,
    pdfData: pdfBase64,
    status: "pending",
    createdAt: serverTimestamp(),
    acceptedAt: null,
    acceptedByName: null,
  });
  return pdfBase64;
}

export async function loadQuote(id) {
  const snap = await getDoc(doc(db, "quotes", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { ...d, createdAt: d.createdAt?.toMillis?.() ?? Date.now(), acceptedAt: d.acceptedAt?.toMillis?.() ?? null };
}

export async function listQuotes() {
  const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => { const data = d.data(); return { ...data, createdAt: data.createdAt?.toMillis?.() ?? Date.now(), acceptedAt: data.acceptedAt?.toMillis?.() ?? null }; });
}

export async function respondToQuote(id, status, acceptedByName = "") {
  await updateDoc(doc(db, "quotes", id), { status, acceptedByName: acceptedByName || null, acceptedAt: serverTimestamp() });
}
