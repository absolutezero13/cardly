import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import { AnalyticsEvent, analyticsService } from "@/services/analytics";
import auth from "@/services/auth";
import {
  Colors,
  Layout,
  Spacing,
  Typography,
  withOpacity,
} from "@/theme/Theme";
import welcomeVideo from "../../assets/videos/welcome.mp4";

const WelcomeScreen = () => {
  const [isStarting, setIsStarting] = useState(false);

  const player = useVideoPlayer(welcomeVideo, (nextPlayer) => {
    nextPlayer.loop = true;
    nextPlayer.muted = true;
    nextPlayer.play();
  });

  const getStarted = async () => {
    setIsStarting(true);

    try {
      await auth.signInAnonymously();
    } catch (error) {
      console.error("Anonymous authentication failed", error);
      const message =
        error instanceof Error ? error.message : "Unable to get started.";

      analyticsService.logEvent(AnalyticsEvent.ActionError, {
        action: "sign_in",
        message,
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <View style={styles.root}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={styles.video}
      />
      <LinearGradient
        colors={[
          withOpacity(Colors.background, 0),
          withOpacity(Colors.background, 0.5),
          Colors.background,
        ]}
        locations={[0.35, 0.68, 1]}
        pointerEvents="none"
        style={styles.gradient}
      />

      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={styles.overlay}
      >
        <View style={styles.action}>
          <AppButton
            label="Get Started"
            loading={isStarting}
            onPress={getStarted}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  action: {
    width: "100%",
    maxWidth: Layout.contentMaxWidth,
    alignSelf: "center",
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  errorMessage: {
    ...Typography.caption,
    color: Colors.danger,
    textAlign: "center",
  },
});

export default WelcomeScreen;
