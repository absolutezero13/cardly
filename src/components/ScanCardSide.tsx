import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, Radii, Spacing, Typography, scale } from "@/theme/Theme";

type ScanCardSideProps = {
  label: string;
  side: "front" | "back";
  uri: string | null;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
};

const ScanCardSide = ({
  label,
  side,
  uri,
  isActive,
  onSelect,
  onRemove,
}: ScanCardSideProps) => (
  <Pressable
    accessibilityLabel={uri ? `Retake card ${side}` : `Capture card ${side}`}
    accessibilityRole="button"
    accessibilityState={{ selected: isActive }}
    onPress={onSelect}
    style={({ pressed }) => [styles.column, pressed && styles.pressed]}
  >
    <View
      style={[styles.slot, uri && styles.filled, isActive && styles.active]}
    >
      {uri ? (
        <Image
          contentFit="cover"
          source={{ uri }}
          style={styles.image}
          transition={150}
        />
      ) : (
        <SymbolView
          name={{ ios: "plus", android: "add", web: "add" }}
          size={scale(16)}
          tintColor={isActive ? Colors.primary : Colors.textMuted}
        />
      )}
      {uri ? (
        <Pressable
          accessibilityLabel={`Remove card ${side}`}
          accessibilityRole="button"
          hitSlop={Spacing.sm}
          onPress={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          style={styles.removeButton}
        >
          <SymbolView
            name={{ ios: "xmark", android: "close", web: "close" }}
            size={scale(9)}
            tintColor={Colors.text}
          />
        </Pressable>
      ) : null}
    </View>
    <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  column: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  slot: {
    width: scale(46),
    height: scale(64),
    borderRadius: Radii.sm,
    borderCurve: "continuous",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(13, 27, 45, 0.85)",
  },
  filled: {
    borderStyle: "solid",
  },
  active: {
    borderColor: Colors.primary,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: scale(3),
    right: scale(3),
    width: scale(18),
    height: scale(18),
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 12, 22, 0.82)",
  },

  label: {
    ...Typography.caption,
    fontSize: scale(12),
    color: Colors.textMuted,
    fontWeight: "600",
  },
  labelActive: {
    color: Colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default ScanCardSide;
