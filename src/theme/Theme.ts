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
const navigationFontFamily =
  Platform.select({
    ios: "System",
    default: "sans-serif",
  }) ?? "sans-serif";

export const scale = (value: number) =>
  PixelRatio.roundToNearestPixel(value * scaleFactor);

export const withOpacity = (color: string, opacity: number) => {
  const channels = color.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
  );

  if (!channels) {
    throw new Error(
      `withOpacity expects an rgb(red, green, blue) color, received ${color}`,
    );
  }

  const [, red, green, blue] = channels;
  const clampedOpacity = Math.min(1, Math.max(0, opacity));

  return `rgba(${red}, ${green}, ${blue}, ${clampedOpacity})`;
};

const Palette = {
  black: "rgb(0, 0, 0)",
  white: "rgb(255, 255, 255)",
  background: "rgb(7, 17, 31)",
  cameraOverlay: "rgb(4, 10, 20)",
  surface: "rgb(13, 27, 45)",
  surfaceElevated: "rgb(20, 38, 61)",
  primary: "rgb(94, 143, 232)",
  primaryPressed: "rgb(75, 120, 206)",
  text: "rgb(244, 247, 252)",
  textMuted: "rgb(145, 162, 184)",
  danger: "rgb(240, 116, 131)",
};

export const Colors = {
  ...Palette,
  border: withOpacity(Palette.white, 0.08),
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
