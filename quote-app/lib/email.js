// lib/email.js
// ─────────────────────────────────────────────────────────────
// STEP 2: Set up EmailJS to receive email notifications.
//
// 1. Sign up free at https://www.emailjs.com
// 2. Add an Email Service (Gmail works great)
// 3. Create an Email Template with these variables:
//      {{client_name}}   {{quote_ref}}   {{accepted_by}}
//      {{accepted_at}}   {{quote_link}}  {{to_email}}
// 4. Copy your IDs below.
// ─────────────────────────────────────────────────────────────

import emailjs from "@emailjs/browser";

const SERVICE_ID  = "service_lrihm0h";
const TEMPLATE_ID = "template_ebm1km6";
const PUBLIC_KEY  = "_1RNUsqdlcHncGkKb";

// Your email address — where notifications will be sent
const YOUR_EMAIL  = "belindaburger84@gmail.com";

export async function sendAcceptanceEmail({ clientName, quoteRef, acceptedBy, acceptedAt, quoteLink }) {
  const templateParams = {
    to_email:    YOUR_EMAIL,
    client_name: clientName,
    quote_ref:   quoteRef,
    accepted_by: acceptedBy || clientName,
    accepted_at: new Date(acceptedAt).toLocaleString("en-ZA", {
      dateStyle: "full", timeStyle: "short",
    }),
    quote_link:  quoteLink,
  };

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
}
