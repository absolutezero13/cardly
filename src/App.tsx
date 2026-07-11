import { NavigationContainer } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigation from "./navigation/RootNavigation";
import auth from "./services/auth";
import useUserStore from "./stores/UserStore";
import { Colors, NavigationTheme } from "./theme/Theme";

const App = () => {
  const user = useUserStore((state) => state.user);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
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
