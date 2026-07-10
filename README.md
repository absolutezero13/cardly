# Cardly

Cardly is an Expo app using React Navigation.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

The app mirrors the `fit-pet` navigation hierarchy: `src/app.tsx` contains the navigation container, `src/navigation/rootNavigation.tsx` owns the native stack, and `src/navigation/tabBarNavigation.tsx` uses `@bottom-tabs/react-navigation` with `react-native-bottom-tabs`.

The native tab navigator is experimental and requires a [development build](https://docs.expo.dev/develop/development-builds/introduction/) rather than Expo Go.
