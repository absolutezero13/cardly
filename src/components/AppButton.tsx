import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, Radii, Spacing, Typography, scale } from "@/theme/Theme";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: ComponentProps<typeof SymbolView>["name"];
};

const AppButton = ({
  label,
  onPress,
  accessibilityLabel = label,
  disabled = false,
  loading = false,
  icon,
}: AppButtonProps) => {
  const isGlassAvailable = isGlassEffectAPIAvailable();
  const content = loading ? (
    <ActivityIndicator color={Colors.text} />
  ) : (
    <View style={styles.content}>
      <Text style={styles.label}>{label}</Text>
      {icon ? (
        <SymbolView name={icon} size={scale(17)} tintColor={Colors.text} />
      ) : null}
    </View>
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.pressable, (disabled || loading) && styles.disabled]}
    >
      {isGlassAvailable ? (
        <GlassView
          tintColor={Colors.primary}
          colorScheme="dark"
          glassEffectStyle="regular"
          isInteractive
          style={styles.surface}
        >
          {content}
        </GlassView>
      ) : (
        <View style={[styles.surface, styles.fallback]}>{content}</View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
    height: scale(52),
    borderRadius: Radii.md,
  },
  surface: {
    flex: 1,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    backgroundColor: "rgba(94, 143, 232, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    ...Typography.button,
    color: Colors.text,
  },

  disabled: {
    opacity: 0.5,
  },
});

export default AppButton;
