# QuoteShare — Setup Guide

A complete web app to upload PDF quotes, share links with clients via WhatsApp,
and receive email notifications when clients accept.

---

## What You Get

- **Admin Dashboard** — upload quotes, see all statuses at a glance
- **Shareable Client Link** — `/quote/[id]` — clients view PDF and accept/decline
- **WhatsApp Share Button** — pre-filled message ready to send
- **Email Notification** — you get an email the moment a client accepts, with all details

---

## Step 1 — Set Up Firebase (database + file storage)

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it a name → click through the setup
3. In your project, click **"Web"** (</>) to add a web app → register it
4. Copy the `firebaseConfig` object shown — you'll need it shortly

### Enable Firestore (database)
- Left sidebar → **Firestore Database** → **Create database**
- Choose **Start in test mode** → pick a region → Done

### Enable Storage (for PDFs)
- Left sidebar → **Storage** → **Get started**
- Choose **Start in test mode** → Done

### Paste your config
Open `lib/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",         // ← paste from Firebase
  authDomain:        "your-app.firebaseapp.com",
  projectId:         "your-app",
  storageBucket:     "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc123",
};
```

---

## Step 2 — Set Up EmailJS (email notifications)

1. Go to [https://www.emailjs.com](https://www.emailjs.com) → Sign up free
2. **Add Email Service** → choose Gmail → connect your Gmail account
3. **Email Templates** → Create Template

   Use this template body:
   ```
   Hi there,

   Great news! A client has accepted a quote.

   Client:      {{client_name}}
   Quote Ref:   {{quote_ref}}
   Accepted By: {{accepted_by}}
   Accepted At: {{accepted_at}}

   View the quote: {{quote_link}}
   ```
   Set **To Email** field to: `{{to_email}}`

4. Copy your **Service ID**, **Template ID**, and **Public Key**

### Paste into the app
Open `lib/email.js` and fill in:

```js
const SERVICE_ID  = "service_abc123";
const TEMPLATE_ID = "template_xyz789";
const PUBLIC_KEY  = "user_AbCdEfGhIj";
const YOUR_EMAIL  = "you@yourbusiness.com";   // ← your email address
```

---

## Step 3 — Run Locally (to test)

Make sure [Node.js](https://nodejs.org) is installed, then:

```bash
cd quote-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app is running!

---

## Step 4 — Deploy to Vercel (free, live in 2 minutes)

1. Push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a repo on github.com, then:
   git remote add origin https://github.com/YOURNAME/quote-app.git
   git push -u origin main
   ```

2. Go to [https://vercel.com](https://vercel.com) → Sign in with GitHub
3. Click **Add New → Project** → select your `quote-app` repo
4. Click **Deploy** — done! 🎉

Your app will be live at: `https://quote-app-yourname.vercel.app`

Share that URL with clients as your quote links.

---

## How to Use It Daily

1. Open your dashboard URL
2. Click **+ New Quote** → upload the PDF → enter client name
3. Copy the link or tap **Share on WhatsApp**
4. Client opens link, views PDF, clicks **Accept Quote**, enters their name
5. **You get an email** with all details + a link back to the quote
6. Dashboard updates to show ✓ Accepted

---

## File Structure

```
quote-app/
├── pages/
│   ├── index.js          ← Admin dashboard & upload
│   └── quote/[id].js     ← Client-facing quote view
├── lib/
│   ├── firebase.js        ← Firebase config & helpers  ← EDIT THIS
│   └── email.js           ← EmailJS config             ← EDIT THIS
├── package.json
└── SETUP.md              ← This file
```

---

## Need Help?

The two files you need to edit are:
- `lib/firebase.js` — paste your Firebase config
- `lib/email.js` — paste your EmailJS keys + your email address

Everything else is ready to go.
