import type { Theme } from "@react-navigation/native";
import { Dimensions, PixelRatio, Platform, StyleSheet } from "react-native";

const REFERENCE_SCREEN_WIDTH = 390;
const MINIMUM_SCALE = 0.85;
const MAXIMUM_SCALE = 1.15;
const screenWidth = Dimensions.get("window").width;
const scaleFactor = Math.min(
  Math.max(screenWidth / REFERENCE_SCREEN_WIDTH, MINIMUM_SCALE),
  MAXIMUM_SCALE,
);
const navigationFontFamily = Platform.select({
  ios: "System",
  default: "sans-serif",
}) ?? "sans-serif";

export const scale = (value: number) =>
  PixelRatio.roundToNearestPixel(value * scaleFactor);

export const Colors = {
  background: "#07111F",
  surface: "#0D1B2D",
  surfaceElevated: "#14263D",
  primary: "#5E8FE8",
  primaryPressed: "#4B78CE",
  text: "#F4F7FC",
  textMuted: "#91A2B8",
  border: "rgba(255, 255, 255, 0.08)",
  danger: "#F07483",
};

export const Spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(24),
  xxl: scale(32),
};

export const Radii = {
  sm: scale(10),
  md: scale(16),
  lg: scale(24),
  full: scale(999),
};

export const Layout = {
  screenHorizontalPadding: Spacing.xl,
  screenVerticalPadding: Spacing.lg,
  sectionGap: Spacing.xl,
  minimumTouchSize: scale(44),
  contentMaxWidth: scale(560),
};

export const Typography = StyleSheet.create({
  title: {
    fontSize: scale(30),
    lineHeight: scale(36),
    fontWeight: "700",
    letterSpacing: scale(-0.5),
  },
  body: {
    fontSize: scale(16),
    lineHeight: scale(24),
    fontWeight: "400",
  },
  button: {
    fontSize: scale(16),
    lineHeight: scale(20),
    fontWeight: "600",
  },
  caption: {
    fontSize: scale(13),
    lineHeight: scale(18),
    fontWeight: "400",
  },
});

export const NavigationTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.danger,
  },
  fonts: {
    regular: {
      fontFamily: navigationFontFamily,
      fontWeight: "400",
    },
    medium: {
      fontFamily: navigationFontFamily,
      fontWeight: "500",
    },
    bold: {
      fontFamily: navigationFontFamily,
      fontWeight: "600",
    },
    heavy: {
      fontFamily: navigationFontFamily,
      fontWeight: "700",
    },
  },
};
