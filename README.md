# 365 Travel SIM

Customer store for travel data SIMs (eSIM and USIM, 200+ destinations) with a separate admin page.

| File | What it is |
|---|---|
| `index.html` | The customer website |
| `admin.html` | Admin page: orders, payment confirmation, status, CSV export, store settings |
| `config.js` | Your Firebase settings (edit this) |
| `firestore.rules` | Database security rules (paste into Firebase) |
| `flags/` | Round country flags |

Prices, plans, speeds, pickup airports and exchange rates are in the `STORE CONFIG` block near the top of the script in **both** `index.html` and `admin.html`.

## 1. Put it on GitHub Pages

1. Create a new repository on GitHub, e.g. `365-travel-sim`.
2. Upload **all** files and the `flags` folder (Add file → Upload files, drag the whole folder content).
3. Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
4. After a minute the site is live at `https://<your-username>.github.io/365-travel-sim/`
   Admin: `https://<your-username>.github.io/365-travel-sim/admin.html`

At this point the site works as a catalogue. To take orders, connect Firebase:

## 2. Connect Firebase (orders + admin login)

1. https://console.firebase.google.com → **Add project**.
2. **Build → Firestore Database → Create database** (production mode, region `asia-northeast3` Seoul).
3. **Firestore → Rules**: paste the content of `firestore.rules`, change `admin@example.com` to your admin email, **Publish**.
4. **Build → Authentication → Get started → Email/Password → Enable**.
   Then **Users → Add user** with that same admin email and a strong password.
5. **Authentication → Settings → Authorized domains → Add domain**: `<your-username>.github.io`
6. **Project settings → Your apps → Web (</>)** → register the app → copy the `firebaseConfig` object into `config.js` (replace `null`).
7. Commit `config.js`. Done. The Firebase web config is safe to publish; the security rules protect the data.

## How orders work

- Customer checks out → order saved in Firestore `orders/<order number>` as **Awaiting payment**.
- Customer sees bank transfer details (set them in **admin → Store settings**).
- Admin opens `admin.html`, signs in, clicks the order → **Confirm payment received**, then sets status (Processing → Sent / Shipped → Completed) and adds the ICCID or tracking number.
- Customers follow their order on **My orders** (saved on their device, or look up by order number + email).

## Before going fully live

- **Card / KakaoPay**: needs a payment gateway (Toss Payments, PortOne/Iamport, or Stripe). Until then they show as "Coming soon".
- **Emails** (order confirmation, eSIM QR): add a Firebase Extension like *Trigger Email* or send them manually from the admin page details.
- **Exchange rates** in `CURRENCIES` are fixed estimates. Update them from time to time.
- **Refund policy and plan prices** are example values. Edit them to match your supplier.
