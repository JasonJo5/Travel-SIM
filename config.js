/* 365 Travel SIM — site settings
 *
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Project settings → Your apps → Add app → Web. Copy the config object here.
 * 3. Leave it as null and the store still works as a catalogue, but checkout
 *    and order tracking show "Online ordering isn't connected yet".
 */
window.FIREBASE_CONFIG = null;
/* Example:
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
*/

/* Card and KakaoPay need a payment gateway (e.g. Toss Payments or PortOne).
 * Until one is connected they show as "Coming soon" and customers pay by bank transfer.
 * Keep this false on the live site. */
window.TEST_PAYMENTS = false;
