import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import auth from "@/services/auth";
import {
  Colors,
  Layout,
  Spacing,
  Typography,
  scale,
} from "@/theme/Theme";

const WelcomeScreen = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getStarted = async () => {
    setIsStarting(true);
    setErrorMessage(null);

    try {
      await auth.signInAnonymously();
    } catch (error) {
      console.error("Anonymous authentication failed", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to get started.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={styles.safeArea}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Cardly</Text>
        <View style={styles.action}>
          {errorMessage ? (
            <Text selectable style={styles.errorMessage}>
              {errorMessage}
            </Text>
          ) : null}
          <AppButton
            label="Get Started"
            loading={isStarting}
            onPress={() => void getStarted()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(64),
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
  },
  action: {
    width: "100%",
    maxWidth: Layout.contentMaxWidth,
    gap: Spacing.md,
  },
  errorMessage: {
    ...Typography.caption,
    color: Colors.danger,
    textAlign: "center",
  },
});

export default WelcomeScreen;
