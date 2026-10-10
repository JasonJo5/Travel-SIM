/**
 * 365 Travel SIM — WhatsApp alert for every new order.
 *
 * Runs on Firebase (Cloud Functions, 2nd gen). When a customer places an order,
 * the website saves it to Firestore at orders/{orderId}. This function fires
 * on that new document and sends a WhatsApp message to the shop owner.
 *
 * Sending is done with CallMeBot (free, for personal notifications).
 * The phone number and API key are stored as Firebase secrets, never in the website.
 */
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Secrets: set them once with `firebase functions:secrets:set NAME`
const WA_PHONE = defineSecret("WA_PHONE");       // your WhatsApp number with country code, e.g. +821012345678
const WA_APIKEY = defineSecret("WA_APIKEY");     // the API key CallMeBot sends you

// Plain settings (functions/.env)
const ADMIN_URL = defineString("ADMIN_URL", { default: "" });       // e.g. https://yourname.github.io/365-travel-sim/admin.html
const REGION = "asia-northeast3";                                    // must match your Firestore location (Seoul)

const PAY = { card: "Card", kakaopay: "KakaoPay", bank: "Bank transfer" };
const won = (n) => "₩" + Math.round(Number(n) || 0).toLocaleString("en-US");

async function sendWhatsApp(text) {
  const url = "https://api.callmebot.com/whatsapp.php"
    + "?phone=" + encodeURIComponent(WA_PHONE.value())
    + "&text=" + encodeURIComponent(text)
    + "&apikey=" + encodeURIComponent(WA_APIKEY.value());
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) logger.error("WhatsApp send failed", { status: res.status, body: body.slice(0, 500) });
  else logger.info("WhatsApp alert sent", { reply: body.replace(/<[^>]+>/g, " ").slice(0, 200) });
}

// 1) New order → WhatsApp
exports.notifyNewOrder = onDocumentCreated(
  { document: "orders/{orderId}", region: REGION, secrets: [WA_PHONE, WA_APIKEY], retry: false },
  async (event) => {
    const o = event.data?.data();
    if (!o) return;
    const items = (o.items || [])
      .map((i) => `• ${i.destName} · ${i.title}${i.qty > 1 ? ` ×${i.qty}` : ""} — ${won(i.unit * i.qty)}`)
      .join("\n");
    const payStatus = o.status?.pay || o.payment?.status;
    const lines = [
      "🛒 *New order* " + o.id,
      "",
      items,
      "",
      "*Total:* " + won(o.total),
      "*Payment:* " + (PAY[o.payment?.method] || o.payment?.method || "-") + (payStatus === "pending" ? " (awaiting payment)" : " (paid)"),
      o.payment?.method === "bank" ? "*Sender name:* " + (o.payment?.depositor || o.customer?.name || "-") : null,
      "",
      "*Customer:* " + (o.customer?.name || "-"),
      "*Email:* " + (o.customer?.email || "-"),
      "*Phone:* " + (o.customer?.phone || "-"),
      o.device ? "*Phone model:* " + o.device.brand + " · " + o.device.model : null,
      o.depart ? "*Departure:* " + o.depart : null,
      ADMIN_URL.value() ? "\nOpen admin: " + ADMIN_URL.value() : null,
    ].filter((l) => l !== null);
    try {
      await sendWhatsApp(lines.join("\n"));
    } catch (err) {
      logger.error("WhatsApp alert error", err);
    }
  }
);

// 2) Optional reminder: an order you marked as paid but haven't sent the eSIM for.
//    Fires when payment changes to "paid" — useful when you confirm bank transfers from your phone.
exports.notifyPaid = onDocumentUpdated(
  { document: "orders/{orderId}", region: REGION, secrets: [WA_PHONE, WA_APIKEY], retry: false },
  async (event) => {
    const before = event.data?.before?.data()?.status || {};
    const after = event.data?.after?.data() || {};
    const st = after.status || {};
    if (before.pay !== "paid" && st.pay === "paid" && st.order !== "delivered") {
      try {
        await sendWhatsApp(`💰 *Payment confirmed* ${after.id}\n${won(after.total)} · ${after.customer?.name || ""}\nRemember to send the eSIM.`);
      } catch (err) {
        logger.error("WhatsApp paid alert error", err);
      }
    }
  }
);

// 3) Customer pressed "I've sent the transfer" → WhatsApp, so you can check your bank app.
exports.notifyTransferSent = onDocumentUpdated(
  { document: "orders/{orderId}", region: REGION, secrets: [WA_PHONE, WA_APIKEY], retry: false },
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    if (before.transferClaim || !after.transferClaim) return;
    if ((after.status?.pay || after.payment?.status) === "paid") return;
    const lines = [
      "💸 *Customer says they paid* " + after.id,
      "",
      "*Amount:* " + won(after.total),
      "*Sender name:* " + (after.transferClaim.name || after.payment?.depositor || after.customer?.name || "-"),
      "*Customer:* " + (after.customer?.name || "-") + " · " + (after.customer?.phone || "-"),
      "",
      "Check your bank app for this deposit, then press \"Confirm payment received\" in admin and send the eSIM.",
      ADMIN_URL.value() ? "\nOpen admin: " + ADMIN_URL.value() : null,
    ].filter((l) => l !== null);
    try {
      await sendWhatsApp(lines.join("\n"));
    } catch (err) {
      logger.error("WhatsApp transfer alert error", err);
    }
  }
);
