import { Colors, Radii, scale, withOpacity } from "@/theme/Theme";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type IconButtonProps = {
  accessibilityLabel: string;
  icon: ComponentProps<typeof SymbolView>["name"];
  onPress: () => void;
  disabled?: boolean;
  iconSize?: number;
  size?: number;
  tintColor?: string;
};

const IconButton = ({
  accessibilityLabel,
  icon,
  onPress,
  disabled = false,
  iconSize = scale(20),
  size = scale(52),
  tintColor = Colors.text,
}: IconButtonProps) => {
  const isGlassAvailable = isGlassEffectAPIAvailable();
  const buttonStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  const iconView = (
    <SymbolView name={icon} size={iconSize} tintColor={tintColor} />
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={scale(8)}
      onPress={onPress}
      style={[styles.pressable, buttonStyle, disabled && styles.disabled]}
    >
      {isGlassAvailable ? (
        <GlassView
          colorScheme="dark"
          glassEffectStyle="regular"
          isInteractive
          style={[styles.surface, buttonStyle]}
        >
          {iconView}
        </GlassView>
      ) : (
        <View style={[styles.surface, styles.fallback, buttonStyle]}>
          {iconView}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Radii.full,
  },
  surface: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    backgroundColor: withOpacity(Colors.surface, 0.82),
    borderWidth: 1,
    borderColor: Colors.border,
  },

  disabled: {
    opacity: 0.5,
  },
});

export default IconButton;
