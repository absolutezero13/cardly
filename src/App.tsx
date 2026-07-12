import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigation from "./navigation/RootNavigation";
import { AnalyticsEvent, analyticsService } from "./services/analytics";
import auth from "./services/auth";
import useUserStore from "./stores/UserStore";
import { Colors, NavigationTheme } from "./theme/Theme";

const AMPLITUDE_API_KEY = "REPLACE_WITH_AMPLITUDE_API_KEY";
const HAS_LAUNCHED_KEY = "hasLaunched";

const trackFirstLaunch = async () => {
  const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED_KEY);

  if (!hasLaunched) {
    analyticsService.logEvent(AnalyticsEvent.FirstLaunch);
    await AsyncStorage.setItem(HAS_LAUNCHED_KEY, "true");
  }
};

const App = () => {
  const user = useUserStore((state) => state.user);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    analyticsService.init(AMPLITUDE_API_KEY);
    trackFirstLaunch().catch((error) => {
      console.warn("Failed to track first launch", error);
    });

    return auth.initialize(() => setIsAuthInitialized(true));
  }, []);

  if (!isAuthInitialized) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.background}
      />
      <NavigationContainer theme={NavigationTheme}>
        <RootNavigation hasUser={Boolean(user)} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});

export default App;
