import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import emailjs from "@emailjs/browser";

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

export default async function handler(req, res) {
  // Only allow GET requests from Vercel cron
  if (req.method !== "GET") return res.status(405).end();

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - THREE_DAYS_MS;

  try {
    const snap = await getDocs(query(collection(db, "quotes"), where("status", "==", "pending")));

    const overdue = snap.docs
      .map(d => d.data())
      .filter(q => q.createdAt?.toMillis?.() < cutoff);

    for (const quote of overdue) {
      const quoteLink = `${process.env.NEXT_PUBLIC_BASE_URL || "https://alublack-quotes.vercel.app"}/quote/${quote.id}`;
      const sentDate  = new Date(quote.createdAt.toMillis()).toLocaleDateString("en-ZA", {
        day:"2-digit", month:"long", year:"numeric"
      });

      await emailjs.send(
        "service_lrihm0h",
        "template_feh6bor",
        {
          to_email:    "sales@alublack.com",
          client_name: quote.clientName,
          quote_ref:   quote.quoteRef,
          sent_date:   sentDate,
          quote_link:  quoteLink,
        },
        "_1RNUsqdlcHncGkKb"
      );
    }

    res.status(200).json({ sent: overdue.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
