import { NavigationContainer } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigation from "./navigation/RootNavigation";
import auth from "./services/auth";
import useUserStore from "./stores/UserStore";
import {
  Colors,
  Layout,
  NavigationTheme,
  Radii,
  Spacing,
  Typography,
} from "./theme/Theme";

const App = () => {
  const user = useUserStore((state) => state.user);
  const [authFailed, setAuthFailed] = useState(false);

  const retryAuthentication = () => {
    setAuthFailed(false);
    auth.signInAnonymously().catch((error) => {
      console.error("Anonymous authentication failed", error);
      setAuthFailed(true);
    });
  };

  useEffect(() => {
    return auth.initialize((error) => {
      console.error("Anonymous authentication failed", error);
      setAuthFailed(true);
    });
  }, []);

  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.background}
        />
        <View style={styles.authContainer}>
          {authFailed ? (
            <>
              <Text style={styles.authMessage}>Unable to start Cardly.</Text>
              <Pressable
                onPress={retryAuthentication}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={Colors.primary} />
          )}
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
        <RootNavigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingHorizontal: Layout.screenHorizontalPadding,
    backgroundColor: Colors.background,
  },
  authMessage: {
    ...Typography.body,
    color: Colors.text,
  },
  retryButton: {
    minHeight: Layout.minimumTouchSize,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceElevated,
  },
  retryButtonPressed: {
    backgroundColor: Colors.primaryPressed,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
});

export default App;
