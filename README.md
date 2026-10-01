# ⚡ EV-Share – Pan-India Peer-to-Peer EV Charging Network

[![Live Demo](https://img.shields.io/badge/Live_Website-Online-00C853?style=for-the-badge&logo=github)](https://shi13311.github.io/EV-share/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://ev-share-five.vercel.app)
[![Security](https://img.shields.io/badge/Security-Salted_SHA--256_%2B_RBAC-purple?style=for-the-badge)](https://shi13311.github.io/EV-share/)
[![Pan India](https://img.shields.io/badge/Coverage-75%2B_Indian_Cities-orange?style=for-the-badge)](https://shi13311.github.io/EV-share/)

---

## 🌐 24/7 PERMANENT LIVE WEBSITE LINKS

* 🌟 **GitHub Pages (Primary 24/7 Live):** 👉 **[https://shi13311.github.io/EV-share/](https://shi13311.github.io/EV-share/)**
* 🚀 **Vercel Production Live:** 👉 **[https://ev-share-five.vercel.app](https://ev-share-five.vercel.app)**

*(Open on any Phone, Android, iPhone, Laptop, or Mac — No installation required!)*

---

## ✨ Features & Architecture

- 🖤 **Ultra-Modern Dark Theme:** AMOLED / OLED dark carbon styling with Tailwind CSS.
- 🔐 **Strict Authentication & Security Gate:** Unauthenticated users see ONLY Sign In & Register tabs. No unauthenticated user can access private features.
- 🛡️ **Salted SHA-256 Password Cryptography:** Passwords are never stored in plain text. Stored securely using unique salt + SHA-256 cryptographic hashing.
- 🔑 **Strong Password Enforcement:** Minimum 8 chars with uppercase, lowercase, number, and special symbols (@#$%).
- 📱 **Validations & Duplicate Protection:** Strict email format, 10-digit mobile validation, duplicate email/mobile rejection, and password confirmation match.
- 🔄 **OTP-Based Forgot Password:** Secure 6-digit OTP verification flow for resetting passwords.
- 👑 **Strict Role-Based Access Control (RBAC):** Exactly ONE Master Admin (`admin@evshare.in`). 403 Forbidden protection against unauthorized administrative actions.
- 🗺️ **Pan-India Interactive Map:** 75+ Indian cities covered with real-time Leaflet.js maps & dynamic station status (Type-2 AC, 15A Socket, CCS2 Fast).
- 📅 **Interactive Booking & Pricing Engine:** Transparent formula `(Duration × Tariff) + (Units × Slab) + 18% GST + 5% Platform Fee`.
- 🎟️ **Digital QR Check-in Pass:** Dynamic QR code generation for driver check-in at host location.
- 🏠 **Residential Host Portal:** 6-Step socket listing flow, earnings manager, and payout ledger.
- 📱 **100% Cross-Device Responsive:** Seamless experience across Mobile, Tablet, and Desktop.

---

## 🔐 Roles & Permissions

- 🚗 **EV Driver:** Search chargers across 75+ cities, book charging slots, get digital QR session pass, manage wallet, view personal bookings.
- 🔌 **Charger Host:** List residential sockets via 6-step wizard, set custom tariffs, manage availability, track monthly earnings and payouts.
- 👑 **Master Administrator:** Moderate pending host sockets, approve/reject chargers, manage users, modify bookings, track platform commission.

---

## 🛠️ Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/shi13311/EV-share.git

# 2. Open project folder
cd EV-share

# 3. Start local server
node server.js
```

Then visit **http://localhost:5000** or open `index.html` in your browser!
