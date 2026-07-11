import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Colors,
  Layout,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";

const HEADER_TOP_PADDING = Spacing.xs;
const HEADER_ROW_HEIGHT = Layout.minimumTouchSize;
const HEADER_BOTTOM_PADDING = Spacing.xs;
const FADE_HEIGHT = scale(20);

type AppHeaderProps = {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  isModalScreen?: boolean;
};

const getAppHeaderHeight = (topInset: number) =>
  topInset + HEADER_TOP_PADDING + HEADER_ROW_HEIGHT + HEADER_BOTTOM_PADDING;

export const getAppHeaderContentInset = (
  topInset: number,
  isModalScreen?: boolean,
) => (isModalScreen ? FADE_HEIGHT : getAppHeaderHeight(topInset) + FADE_HEIGHT);

const AppHeader = ({
  title,
  leftAction,
  rightAction,
  isModalScreen,
}: AppHeaderProps) => {
  const { top } = useSafeAreaInsets();
  const headerHeight = getAppHeaderHeight(top);
  const paddingTop = isModalScreen ? Spacing.lg : top + HEADER_TOP_PADDING;

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <LinearGradient
        colors={[
          Colors.background,
          withOpacity(Colors.background, 0.8),
          withOpacity(Colors.background, 0.6),
          withOpacity(Colors.background, 0),
        ]}
        locations={[0, 0.52, 0.78, 1]}
        pointerEvents="none"
        style={[styles.gradient, { height: headerHeight + FADE_HEIGHT }]}
      />
      <View style={[styles.content, { paddingTop }]}>
        <View style={styles.row}>
          {leftAction}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  blur: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  gradient: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  content: {
    paddingBottom: HEADER_BOTTOM_PADDING,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  row: {
    minHeight: HEADER_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  title: {
    ...Typography.title,
    flex: 1,
    color: Colors.text,
    fontSize: scale(24),
    lineHeight: scale(30),
  },
});

export default AppHeader;
