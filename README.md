# Cardly

Cardly is a React Native app for scanning sports cards and organizing the results. A scan uses photos of both sides of the card, sends them to an AI-backed API, and lets the user review the result before saving it.

The app includes camera capture, gallery import, scan history, favorites, and collections. This repository contains the mobile app; the Express API lives in the separate `cardly-be` repository.

## Architecture

The app is built with React Native, Expo, and TypeScript. It uses an Expo development build because the camera, Firebase, and native tab packages are not available in Expo Go.

The project is split by responsibility:

- `src/screens` owns screen-level state and navigation behavior.
- `src/components` contains reusable UI and scan controls.
- `src/services` handles API calls, authentication, image processing, Storage uploads, and analytics.
- `src/stores` contains shared Zustand state.
- `src/navigation` defines the guest and authenticated navigation trees.
- `src/theme` contains the shared visual tokens.

`react-native-vision-camera` handles direct capture and `expo-image-picker` handles gallery import. Camera permission is requested when the user enters the scan flow, with an open-settings fallback after denial; gallery selection uses the system picker. Before an image is sent or stored, `expo-image-manipulator` resizes it to a maximum width of 1600 pixels and saves it as JPEG at `0.72` quality to reduce the upload payload.

The backend is a single Node.js and Express service deployed on Vercel. Keeping it as one small service was enough for the case study while still giving card analysis, authentication, and database access a proper server-side boundary.

## Scan and save flow

Identification and persistence are separate steps:

1. The user captures or selects the front and back images.
2. The app optimizes them and sends both to `POST /cards/scan`.
3. The backend asks Gemini for structured card metadata and returns it without writing to MongoDB.
4. The user reviews the name, set, rarity, estimated value, and confidence.
5. If the result is saved, the app uploads both images to Firebase Storage and sends the download URLs to `POST /cards`.

This keeps abandoned or incorrect scans out of the database. Temporary optimized files are deleted after each attempt. If an image upload or the MongoDB save fails, the app also tries to remove any Storage objects created during that attempt.

## State management

Zustand is used only for state that needs to be shared across screens:

- `UserStore` holds the current Firebase user ID in memory.
- `CardsStore` holds the current user's cards, loading status, errors, and card update helpers. It deduplicates concurrent initial loads and resets when the user changes.

Collections are fetched by `CollectionsScreen` and kept in local screen state because no other flow needs the complete collection list. Capture progress, selected card sides, modal state, retries, and unsaved edits also stay local to their screens.

## Persistence strategy

Cardly is remote-first:

- MongoDB stores users, collections, and card metadata.
- Firebase Storage stores the front and back images.
- Firebase Anonymous Auth keeps the session across normal app launches.
- AsyncStorage stores only a first-launch analytics flag.
- Zustand and component state are memory-only caches.

There is no offline card cache. A cold start needs network access to load cards and collections. This avoids stale-data conflict handling in a short project, but offline reading would be a useful next step.

A card belongs to at most one collection. Favorites are stored directly on the card and presented as a virtual collection. Deleting a collection sets its cards' `collectionId` to `null`, so the cards remain in History instead of being deleted.

When a MongoDB user is created for the first time, the backend idempotently seeds Football, Basketball, and Baseball collections. New-user detection comes from the Mongo upsert result; the user document does not need a separate seeding flag.

## Backend and third-party services

The mobile app signs users in anonymously with Firebase and sends the current Firebase ID token with API requests. The backend verifies it with Firebase Admin and derives the owner ID from the verified token. Card, collection, and user queries do not trust a client-supplied owner ID. `GET /health` is the only public route.

The scan endpoint accepts a front/back multipart pair and validates file count, size, and supported image types before calling Gemini. It returns distinct error codes for missing images, oversized files, identification failures, unavailable analysis, and invalid model responses. Loading, empty, success, error, retry, and destructive confirmation states are handled in the app.

The main service choices were:

- **Gemini 2.5 Flash-Lite** for multimodal card recognition. Its image input and JSON response schema keep the analysis layer small and avoid parsing free-form text. The project was designed around its developer free tier rather than model sophistication.
- **MongoDB Atlas** for structured user, card, and collection data. Its managed free tier fits the size of the project and Mongoose provides schema validation and useful query indexes.
- **Firebase Anonymous Auth** for a low-friction identity and **Firebase Storage** for card images. The same Firebase identity is verified by the backend before data is accessed.

The estimated card price is not live marketplace data. Gemini is instructed to return a conservative ungraded estimate and to reject unclear, non-card, or mismatched images.

## Analytics

Amplitude sends events in non-development builds. The current events cover first launch, anonymous sign-in, camera or gallery image selection, scan success and failure, scan duration, confirmed card saves, and action failures. Development builds print events locally instead of sending them.

## Assumptions and tradeoffs

- The shared app was treated as product direction, not a pixel-perfect target.
- The full-bleed welcome screen replaces the reference app's longer preference flow because personalization was outside the required core flows.
- Anonymous auth was chosen instead of a visible login flow. It is quick to enter, but the identity cannot be recovered after app data is lost or on a new device without a future account-upgrade flow.
- Cards use one optional collection rather than many-to-many membership because multi-collection support was not required.
- Football, Basketball, and Baseball were chosen as practical default collection names.
- Subscription and paywall behavior from the reference product was left out because it is not part of scanning, history, or collection management.
- Collection rename is supported by the backend but was not added to the mobile UI.

## How AI was used during development

AI coding assistants were used as a second pair of eyes for data-model reviews, client/backend flow checks, implementation comparisons, refactoring, and documentation. Decisions were checked against the actual repositories rather than accepting generated output as correct. TypeScript, linting, native builds, and direct API checks were used for verification.

## Setup

### Mobile app

```bash
npm install
npm run ios     # or: npm run android
npm start
```

Cardly requires a development build. Firebase native configuration is supplied through `GoogleService-Info.plist` on iOS and `google-services.json` on Android.

The deployed API URL currently lives in `src/api/index.ts`, and the Amplitude key lives in `src/App.tsx`. Both should move to environment-based configuration before introducing separate development, staging, and production builds.

### Backend

The backend requires Node.js 20 or newer. From the `cardly-be` repository:

```bash
npm install
cp .env.example .env
npm run dev
```

Backend configuration:

```dotenv
MONGODB_URI=
GEMINI_API_KEY=
GEMINI_CARD_ANALYSIS_MODEL=gemini-2.5-flash-lite
MAX_CARD_IMAGE_BYTES=2097152
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
PORT=3000
```

`FIREBASE_PRIVATE_KEY` may contain escaped `\\n` sequences; the backend converts them before creating the Firebase Admin credential.

## Validation and technical notes

```bash
# Mobile
npx tsc --noEmit
npm run lint

# Backend, from cardly-be
npm run typecheck
```

There is no automated test suite yet. The highest-value additions would cover Gemini response parsing, backend error mapping, and cards-store loading and updates. Other known gaps are offline support, rate limiting around the Gemini endpoint, and environment-based client configuration.
