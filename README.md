# Cardly AI

Cardly AI is a React Native app for scanning sports cards and organizing the results. A scan uses photos of both sides of the card, sends them to an AI-backed API, and lets the user review the result before saving it.

The app includes camera capture, gallery import, scan history, favorites, and collections. This repository contains the mobile app; the Express API lives in the separate [`cardly-be`](https://github.com/absolutezero13/cardly-be) repository.

## Architecture

The app is built with React Native, Expo, and TypeScript. It uses an Expo development build because the camera, Firebase, and native tab packages are not available in Expo Go.

The project is split by responsibility:

- `src/screens` owns screen-level state and navigation behavior.
- `src/components` contains reusable UI and scan controls.
- `src/services` handles API calls, authentication, image processing, Storage uploads, and analytics.
- `src/stores` contains shared Zustand state.
- `src/navigation` defines the guest and authenticated navigation trees.
- `src/theme` contains the shared visual tokens.

`react-native-vision-camera` handles direct capture and `expo-image-picker` handles gallery import. VisionCamera was chosen instead of `expo-camera` because `expo-camera` caused performance issues during development. The capture path uses the back wide-angle camera, requests a 1280 × 960 photo format, and favors capture speed. Camera permission is requested when the user enters the scan flow, with an open-settings fallback after denial; gallery selection uses the system picker. Before an image is sent or stored, `expo-image-manipulator` resizes it to a maximum width of 1600 pixels and saves it as JPEG at `0.72` quality to reduce the upload payload.

The backend is a single Node.js and Express service deployed on Vercel. It keeps the Gemini credential, structured analysis prompt, authentication, and database access outside the mobile app. Routes compose Firebase authentication and database middleware with focused controllers; Gemini analysis stays in a service, while Mongoose schemas own persistence validation. The MongoDB connection is cached across warm serverless invocations. This keeps the service small without collapsing server responsibilities into the client.

## State management

Zustand is used only for state that needs to be shared across screens:

- `UserStore` holds the current Firebase user ID in memory.
- `CardsStore` holds the current user's cards, loading status, errors, and card update helpers. It deduplicates concurrent initial loads and resets when the user changes.

Collection lists are fetched locally by the screens that need them instead of being added to the shared store. Capture progress, selected card sides, modal state, retries, and unsaved edits also stay local to their screens.

## Persistence strategy

Cardly AI is remote-first:

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

The scan endpoint accepts a front/back multipart pair and validates file count, size, and supported image types before calling Gemini. It returns distinct error codes for missing images, oversized files, identification failures, unavailable analysis, and invalid model responses.

The main service choices were:

- **Gemini 2.5 Flash-Lite** can analyze both card images in one multimodal request and return JSON constrained by a response schema. Flash-Lite keeps latency and free-tier usage practical; a custom OCR and recognition pipeline would add complexity without improving the goal of this case study.
- **MongoDB Atlas** fits the user, card, and collection document model, while Mongoose supplies schema validation and query indexes. Its managed free tier also avoids maintaining database infrastructure for a small project.
- **Firebase Anonymous Auth** provides a persistent, low-friction identity without requiring registration or profile management. Firebase Admin can verify its ID tokens, so the project does not need a custom password and session system.
- **Firebase Storage** keeps image binaries out of MongoDB and Vercel's temporary filesystem. The React Native Firebase SDK supports direct uploads and download URLs, leaving MongoDB to store only image references.
- **Vercel** suits the small stateless Express API and provides a practical serverless free tier without an always-on server. The backend caches its MongoDB connection across warm invocations to reduce connection overhead.

The estimated card price is not live marketplace data. Gemini is instructed to return a conservative ungraded estimate and to reject unclear, non-card, or mismatched images.

## Reliability and observability

History and collection flows provide loading, empty, error, retry, pull-to-refresh, and destructive confirmation states. Scanning has a dedicated progress screen and surfaces backend failure messages. Temporary image files are deleted after processing, and failed save attempts use best-effort cleanup for uploaded Storage objects.

**Amplitude** provides lightweight product-event tracking through its React Native SDK without requiring a custom analytics backend. It is initialized when the app starts and tracks first launch, anonymous sign-in, camera or gallery image selection, scan success and failure, scan duration, confirmed card saves, and action failures.

## Assumptions and tradeoffs

- Anonymous auth was chosen for simplicity and to avoid a separate sign-in flow, while keeping the auth boundary on the backend. The tradeoff is that the account cannot be recovered on another device, or after local auth state is lost, until an account-linking flow is added.
- Cards use one optional collection rather than many-to-many membership because multi-collection support was not required.

## How AI was used during development

OpenAI Codex and other AI coding assistants were used extensively throughout development, especially to explore and iterate on the visual design, screen layouts, reusable components, animations, and interaction details. They also helped with architecture, client/backend flow checks, refactoring, and documentation. Every change was reviewed closely, adjusted to fit the product, and verified against the actual implementation using TypeScript, linting, native builds, and direct API checks.

## Setup

### Mobile app

```bash
npm install
npm run ios     # or: npm run android
```

Cardly AI requires a development build. The native run command builds and opens the app; use `npm start` for later JavaScript-only development sessions. Firebase native configuration is supplied through `GoogleService-Info.plist` on iOS and `google-services.json` on Android.
