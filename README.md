# MeChat — Setup & Run Guide

A secure chat application built with React Native (Expo) on the frontend and Express + MongoDB on the backend.

---

## Project structure

```
chat-app-auth-01/
├── assets/              # Images, icons
├── src/                 # Frontend source (screens, components, navigation, services)
├── backend/              # Backend source (Express API)
│   ├── src/
│   │   ├── controllers/  # Route logic (auth, etc.)
│   │   ├── db/            # MongoDB connection
│   │   ├── middleware/    # JWT auth middleware
│   │   ├── models/        # Mongoose schemas
│   │   └── routes/        # Express routes
│   ├── server.js
│   └── .env               # Local secrets (never committed)
├── App.jsx
└── package.json
```

---

## Prerequisites

- **Node.js** (LTS version) installed
- **MongoDB** connection string (local or MongoDB Atlas)
- **Expo Go** app on your phone, or Android Studio set up with an emulator
- An **Expo account**, logged in via `npx expo login` (required — this project is linked to the shared `mechat-team` Expo organization)

---

Create a `.env` file inside `backend/` (this file is gitignored and never committed):

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

## 1. Backend setup

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
npm install
```



Start the backend server:

```bash
npm run dev
```

You should see:
```
Server is running on port 3000
Database connected successfully
```

**Keep this terminal open and running** while you use the app.

---

## 2. Frontend setup

Open a **second terminal** (don't close the backend one), and navigate to the project root:

```bash
cd chat-app-auth-01
npm install
```

### Point the frontend at your backend

Open `src/services/api.js` and check the `BASE_URL`:

```js
const BASE_URL = "http://<your-PC-local-IP>:3000/api";
```

Find your current local IP:
```bash
ipconfig
```
Note: IPv4 Address a j no. ta aibo oita base url er loge match hoite lgbo....jerkhm 10.59.250.69 eta amr aise...torar alada aite pare...replace kori dis


Look for the **IPv4 Address** under your active Wi-Fi adapter, and update `BASE_URL` if it's changed. This IP changes whenever you switch networks (e.g. hostel Wi-Fi vs. hotspot) — update it here whenever that happens. `localhost` will **not** work, since your phone can't reach your PC's localhost.

### Log in to Expo

```bash
npx expo login
```
Use your own Expo account. Make sure you've accepted the invite to the `mechat-team` organization first (check your email, or ask a teammate to invite you from expo.dev → mechat-team → Members).

### Start the frontend

```bash
npx expo start --clear or npx expo start
```

Or, if using Android Studio / a native build:
```bash
npx expo run:android
```

### Open the app

- **Expo Go (phone):** scan the QR code shown in the terminal. Phone and PC must be on the same network (or use `--tunnel` if your network blocks direct connections — see Troubleshooting).
- **Emulator:** start it from Android Studio first, then press `a` in the terminal, or run `npx expo run:android`.

---

## 3. Testing the app

1. Open the app — it should show the Splash screen, then navigate to Login.
2. Register a new account (username, email, password).
3. On success, you'll be navigated to the Home screen showing your logged-in username.
4. Check your **backend terminal** — the request should show up with no errors.
5. Open **MongoDB Compass**, connect to your database, and check the `users` collection — your new user should appear, with the password stored as a bcrypt hash (starts with `$2b$`), never as plain text.

---

## Troubleshooting

**"Failed to download remote update" on Expo Go**
Run `npx expo login` with your own Expo account, and make sure you've been added as a member of the `mechat-team` organization.

**QR code won't connect / stuck loading**
Your network may be blocking direct phone-to-PC connections (common on hostel/campus Wi-Fi). Try:
```bash
npx expo start --tunnel
```

**Backend not reachable from the app**
Double-check `BASE_URL` in `src/services/api.js` matches your PC's *current* local IP (not `localhost`), and that the backend server is actually running (`npm run dev` inside `backend/`).

**"Missing script: dev" error**
Make sure `backend/package.json` has this in its `"scripts"` section:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

## Git workflow reminders

- Never work directly on `main` — always create a branch first:
  ```bash
  git checkout -b your-feature-name
  ```
- Pull the latest `main` before starting new work:
  ```bash
  git checkout main
  git pull origin main
  ```
- Open a Pull Request for review before merging into `main`.
- Never commit `.env` files or `node_modules/` — both are already gitignored.
