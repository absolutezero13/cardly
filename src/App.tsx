import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigation from "./navigation/RootNavigation";
import auth from "./services/auth";
import useUserStore from "./stores/UserStore";

const App = () => {
  const colorScheme = useColorScheme();
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
        <View style={styles.authContainer}>
          {authFailed ? (
            <>
              <Text>Unable to start Cardly.</Text>
              <Pressable
                onPress={retryAuthentication}
                style={styles.retryButton}
              >
                <Text>Try again</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
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
    gap: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default App;
