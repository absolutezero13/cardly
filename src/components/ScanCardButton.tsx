import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useOpenScanCard from "@/hooks/useOpenScanCard";
import { TAB_BAR_HEIGHT } from "@/navigation/constants";
import { Colors, Radii, Spacing, scale } from "@/theme/Theme";

const BUTTON_SIZE = scale(72);

const ScanCardButton = () => {
  const { bottom, right } = useSafeAreaInsets();
  const openScanCard = useOpenScanCard();
  const isGlassAvailable = isGlassEffectAPIAvailable();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: bottom + TAB_BAR_HEIGHT + Spacing.lg,
          right: right + Spacing.lg,
        },
      ]}
    >
      <Pressable
        accessibilityLabel="Scan card"
        accessibilityRole="button"
        onPress={openScanCard}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressablePressed,
        ]}
      >
        {isGlassAvailable ? (
          <GlassView
            isInteractive
            colorScheme="dark"
            glassEffectStyle="regular"
            style={styles.glassButton}
          >
            <SymbolView
              name={{
                ios: "barcode.viewfinder",
                android: "document_scanner",
                web: "document_scanner",
              }}
              size={scale(42)}
              tintColor={Colors.text}
            />
          </GlassView>
        ) : (
          <View style={styles.fallbackButton}>
            <SymbolView
              name={{
                ios: "camera.viewfinder",
                android: "document_scanner",
                web: "document_scanner",
              }}
              size={scale(28)}
              tintColor={Colors.text}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 10,
    elevation: 10,
  },
  pressable: {
    borderRadius: Radii.full,
  },
  pressablePressed: {
    transform: [{ scale: 0.96 }],
  },
  glassButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default ScanCardButton;
