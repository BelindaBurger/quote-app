import emailjs from "@emailjs/browser";

const SERVICE_ID  = "service_lrihm0h";
const TEMPLATE_ID = "template_ebm1km6";
const PUBLIC_KEY  = "_1RNUsqdlcHncGkKb";
const YOUR_EMAIL  = "sales@alublack.com";

export async function sendAcceptanceEmail({ clientName, quoteRef, acceptedBy, acceptedAt, quoteLink, clientMobile, clientEmail }) {
  const templateParams = {
    to_email:      YOUR_EMAIL,
    client_name:   clientName,
    quote_ref:     quoteRef,
    accepted_by:   acceptedBy || clientName,
    accepted_at:   new Date(acceptedAt).toLocaleString("en-ZA", { dateStyle:"full", timeStyle:"short" }),
    quote_link:    quoteLink,
    client_mobile: clientMobile || "Not provided",
    client_email:  clientEmail  || "Not provided",
  };
  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
}
