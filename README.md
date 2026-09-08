# BhoomiOne — Agri E-Commerce Platform

BhoomiOne is a full-stack Agricultural E-Commerce platform connecting farmers, agricultural vendors, and buyers for direct procurement of seeds, crop nutrition/fertilizers, pesticides, tools, and farming equipment.

---

## Project Structure

```
BhoomiOne/
├── server/               # Node.js / Express backend with MongoDB & AWS S3
│   ├── controller/       # Business logic for auth, products, orders, cart, etc.
│   ├── middleware/       # JWT auth (Bearer token & cookie support)
│   ├── models/           # Mongoose schemas (users, products, categories, stores, orders, etc.)
│   ├── routes/           # REST API routes
│   └── app.js            # Express server entry point (Port 8000)
│
└── mobile/               # React Native (Expo + TypeScript) mobile application
    ├── src/
    │   ├── components/   # Modular UI components (Header, ProductCard, BannerCarousel, etc.)
    │   ├── context/      # React Context state management (AuthContext, CartContext)
    │   ├── navigation/   # React Navigation (Bottom Tabs + Native Stack)
    │   ├── screens/      # Full feature screens (Home, Catalog, Cart, Checkout, Orders, Profile)
    │   ├── services/     # Axios API service client layer
    │   ├── theme/        # Agri design system tokens & colors
    │   └── types/        # TypeScript interfaces
    ├── App.tsx           # Root provider wrapper
    └── package.json
```

---

## Getting Started

### 1. Starting the Backend Server

```bash
cd server
npm install
npm run start:dev
```
The server will start on `http://localhost:8000`.

### 2. Starting the React Native Mobile App

```bash
cd mobile
npm install
npx expo start
```

- **iOS Simulator**: Press `i` in the terminal.
- **Android Emulator**: Press `a` in the terminal.
- **Physical Device**: Scan the QR code with the **Expo Go** app (iOS/Android).

---

## Features Built

- **Authentication & Farmer Onboarding**: Sign In, Sign Up, JWT session persistence via AsyncStorage.
- **Dynamic Agri Home Feed**: Real-time promotional banners, value proposition trust bar, seasonal deals, verified partner stores, and supplies catalog.
- **Agri Catalog & Filter System**: Section-based categorization (Seeds, Fertilizers, Crop Protection, Equipment), instant keyword search, and price sorting.
- **Product Details & Application Advice**: Image gallery (AWS S3 signed URLs), stock indicators, usage advice, and customer reviews.
- **Multi-Item Cart & Discount Engine**: Real-time item quantity modifiers, coupon code applicator (e.g. `BHOOMI100`), delivery fee calculator.
- **Checkout & Payments**: Multi-address selector, Cash on Delivery (COD) and Online Payment (Razorpay) options.
- **Order Tracking & Invoices**: Order status timeline (Placed -> Processing -> Shipped -> Delivered), Delhivery AWB tracking integration, tax invoice download.
- **Farmer Profile & Address Book**: Multi-location delivery address management (farm, warehouse, home), wishlist.