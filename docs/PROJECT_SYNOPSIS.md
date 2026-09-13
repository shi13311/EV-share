# PROJECT SYNOPSIS & VIVA GUIDE

## Project Title
**EV-Share: A Peer-to-Peer Residential Electric Vehicle Charging and Slot Reservation Network**

---

## 1. Abstract
The adoption of Electric Vehicles (EVs) in India and globally is accelerating rapidly, yet the growth of public fast-charging infrastructure remains inadequate, resulting in severe "Range Anxiety" for EV owners. Conversely, thousands of residential homeowners have dedicated private AC chargers (3.3 kW / 7.4 kW) that sit idle for over 80% of the day.

**EV-Share** is a decentralized, peer-to-peer (P2P) platform built on the MERN stack (MongoDB, Express.js, React.js, Node.js) that bridges this gap. It allows homeowners (Hosts) to list and monetize their private charging points, while EV drivers can locate, reserve time slots in advance, and pay for charging with guaranteed parking. The platform features an **Anti-Clash Slot Reservation Engine**, **OTP-based physical check-in security**, **Geospatial Map Discovery**, and **automated digital tax invoicing**.

---

## 2. Problem Statement
1. **Public Infrastructure Deficit:** High capital expenditure and land acquisition costs slow down the installation of commercial public charging stations.
2. **Range Anxiety:** EV drivers hesitate to travel inter-city or across congested urban corridors without guaranteed charging access.
3. **Underutilized Private Assets:** Home wallbox chargers are used mostly overnight and remain idle during productive daylight hours.
4. **Queue & Congestion:** Existing public chargers suffer from long queues without prior slot reservation capabilities.

---

## 3. System Architecture & Methodology

```
┌────────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (React.js + Leaflet)            │
│  - Driver Mode (Search, Filter, Map, Anti-Clash Slot Booking)  │
│  - Host Mode (List Charger, Set Tariff, OTP Verification)      │
│  - Admin Mode (KYC Verification, Platform Commission Audit)    │
└───────────────────────────────┬────────────────────────────────┘
                                │ HTTP / REST (JSON)
┌───────────────────────────────▼────────────────────────────────┐
│                 APPLICATION BACKEND (Node.js + Express)        │
│  - Geospatial Query Handler ($near / 2dsphere radius)          │
│  - Anti-Clash Slot Reservation Controller                      │
│  - OTP Check-In & Invoicing Engine                             │
└───────────────────────────────┬────────────────────────────────┘
                                │ Mongoose ODM
┌───────────────────────────────▼────────────────────────────────┐
│                     DATABASE LAYER (MongoDB)                   │
│  - Users Collection (Drivers, Hosts, Vehicle profiles)         │
│  - Chargers Collection (Socket type, Lat/Lng coordinates)      │
│  - Bookings Collection (Unique composite index on slot)        │
│  - Transactions Collection (Payments & Invoices)               │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. The 6 Core Modules

1. **Authentication & Unified Role Switcher:**
   - Single account enabling seamless switching between Driver Mode and Host Mode.
   - Vehicle compatibility profile (Tata Nexon, MG ZS EV, Ola S1 Pro with socket standards).
2. **Host Charger Asset Management:**
   - Station publishing with socket type (`Type-2 AC 7.4kW`, `15A Socket 3.3kW`), parking type, and custom hourly tariff.
   - Host earnings analytics (Revenue ₹, Energy Shared kWh, CO2 offset kg).
3. **Interactive Geospatial Discovery:**
   - Leaflet / OpenStreetMap integration rendering live markers within a 5–10 km radius.
   - Filter chips for socket compatibility and price sorting.
4. **Smart Anti-Clash Slot Reservation Engine:**
   - Real-time time slot availability matrix.
   - Atomic lockout preventing double-booking of the same charger at the same time window.
   - Secure 4-digit OTP generated upon reservation.
5. **Billing & Invoicing Simulation:**
   - Transparent pricing model: $\text{Total} = (\text{Hours} \times \text{Rate}) + \text{Platform Fee (₹15)}$.
   - Digital tax invoice receipt with unique reference ID and print capability.
6. **Super Admin Governance:**
   - Host station verification audit.
   - 10% platform commission accounting.

---

## 5. Mathematical Formulation & Logic

### A. Anti-Clash Concurrency Logic
To ensure that two drivers cannot book the same charger concurrently, MongoDB enforces a composite unique index:
$$\text{Index} = \{\text{chargerId}: 1, \text{bookingDate}: 1, \text{timeSlot}: 1\}$$
Any simultaneous attempt to write a conflicting record triggers a Duplicate Key error (`E11000`), cleanly protecting data integrity.

### B. Invoicing Formula
$$\text{Amount Payable} = (T_{\text{hours}} \times R_{\text{charger}}) + F_{\text{platform}}$$
$$\text{Host Net Payout} = (T_{\text{hours}} \times R_{\text{charger}})$$
Where $F_{\text{platform}} = \text{₹15}$ flat green energy maintenance fee.

---

## 6. Top 15 Viva Questions & Answers (For External Examiners)

**Q1: What is the USP (Unique Selling Proposition) of your project?**
> *Answer:* While commercial apps like Tata Power or Statiq aggregate dedicated public stations, EV-Share is a Peer-to-Peer (P2P) decentralized marketplace enabling regular homeowners to monetize their idle residential EV chargers, drastically increasing charging availability without city infrastructure costs.

**Q2: How do you prevent two users from booking the same charger at the same time?**
> *Answer:* Through our Anti-Clash Reservation Engine. In MongoDB, we implement a composite unique index on `{chargerId, bookingDate, timeSlot}`. If a transaction attempts to reserve an already booked slot, MongoDB rejects it immediately, and the client displays the slot as disabled/booked.

**Q3: How does the driver verify their arrival at the host's house?**
> *Answer:* The platform generates a cryptographically random 4-digit OTP upon booking confirmation. When the driver arrives, the host inputs this OTP on their Host Dashboard to unlock the session and initiate charging.

**Q4: Which database did you choose and why?**
> *Answer:* MongoDB. It natively supports **Geospatial 2dsphere indexing** with operators like `$near` and `$geoWithin`, allowing us to query chargers within a 5 km radius of a user's GPS coordinates in milliseconds.

**Q5: What are the socket types supported?**
> *Answer:* Type-2 AC (7.4 kW / 11 kW) for four-wheelers (Nexon, ZS EV), and 15A Industrial Sockets (3.3 kW) for two-wheelers (Ather, Ola, Chetak).

**Q6: What is the revenue model for the platform?**
> *Answer:* EV-Share takes a 10% platform commission or a nominal ₹15 platform facilitation fee on each successful charging session.

**Q7: How do you handle security and privacy for homeowners?**
> *Answer:* Full home addresses are only revealed after a booking is confirmed with payment. The host also retains full control over allowed hours and can decline bookings.

**Q8: Can one user be both a driver and a host?**
> *Answer:* Yes, we implemented Role-Based Access Control (RBAC) with unified profiles. A user can charge their EV in the morning as a driver, and host their home charger in the evening.

**Q9: How is the app responsive across devices?**
> *Answer:* Built with Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:` breakpoints) and mobile-first container layouts.

**Q10: What future enhancements can be added?**
> *Answer:* IoT smart plug integration (ESP32 / Sonoff relays) for automated electricity cut-off once the booked time expires, and solar net-metering integration.
