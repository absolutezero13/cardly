import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Colors,
  Radii,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";

type ScanLoadingScreenProps = {
  frontUri: string;
  backUri: string;
};

const ScanLoadingScreen = ({ frontUri, backUri }: ScanLoadingScreenProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, Spacing.xl),
          paddingBottom: Math.max(insets.bottom, Spacing.xl),
        },
      ]}
    >
      <View style={styles.imageStage}>
        <View style={[styles.imageCard, styles.backCard]}>
          <Image
            contentFit="cover"
            source={{ uri: backUri }}
            style={styles.image}
          />
        </View>
        <View style={[styles.imageCard, styles.frontCard]}>
          <Image
            contentFit="cover"
            source={{ uri: frontUri }}
            style={styles.image}
          />
        </View>
        <View style={styles.scanBadge}>
          <SymbolView
            name={{
              ios: "sparkles",
              android: "auto_awesome",
              web: "auto_awesome",
            }}
            size={scale(22)}
            tintColor={Colors.text}
          />
        </View>
      </View>

      <View style={styles.copy}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.title}>Identifying your card</Text>
        <Text style={styles.description}>
          Reading the artwork, set details, card number, and rarity from both
          sides.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  imageStage: {
    width: scale(232),
    height: scale(292),
    alignItems: "center",
    justifyContent: "center",
  },
  imageCard: {
    position: "absolute",
    width: scale(150),
    height: scale(210),
    padding: scale(5),
    borderRadius: Radii.lg,
    borderCurve: "continuous",
    backgroundColor: Colors.surfaceElevated,
    boxShadow: "0 18px 42px rgba(0, 0, 0, 0.3)",
  },
  backCard: {
    transform: [{ rotate: "8deg" }, { translateX: scale(24) }],
    opacity: 0.72,
  },
  frontCard: {
    transform: [{ rotate: "-7deg" }, { translateX: scale(-22) }],
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: withOpacity(Colors.white, 0.12),
  },
  scanBadge: {
    position: "absolute",
    bottom: scale(8),
    width: scale(56),
    height: scale(56),
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    boxShadow: "0 10px 28px rgba(94, 143, 232, 0.36)",
  },
  copy: {
    maxWidth: scale(320),
    alignItems: "center",
    gap: Spacing.md,
  },
  title: {
    ...Typography.title,
    fontSize: scale(27),
    color: Colors.text,
    textAlign: "center",
  },
  description: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
});

export default ScanLoadingScreen;
