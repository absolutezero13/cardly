import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import IconButton from "@/components/IconButton";
import ScanCardSide from "@/components/ScanCardSide";
import scanService from "@/services/scan";
import { Colors, Radii, Spacing, Typography, scale } from "@/theme/Theme";

type CardSide = "front" | "back";

const SIDES: { side: CardSide; label: string }[] = [
  { side: "front", label: "Front" },
  { side: "back", label: "Back" },
];

const CARD_ASPECT_RATIO = 0.72;
const FRAME_WIDTH_RATIO = 0.74;
const DIM_COLOR = "rgba(4, 10, 20, 0.55)";
const BRACKET_SIZE = scale(30);
const BRACKET_THICKNESS = scale(3.5);
const SHUTTER_SIZE = scale(76);
const CONTROL_SIZE = scale(52);

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: "images",
  allowsEditing: true,
  quality: 0.8,
};

const ScanCardScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission] = useCameraPermissions();

  const [images, setImages] = useState<Record<CardSide, string | null>>({
    front: null,
    back: null,
  });
  const [activeSide, setActiveSide] = useState<CardSide>("front");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const isReady = Boolean(images.front && images.back);
  const frameWidth = width * FRAME_WIDTH_RATIO;
  const frameHeight = frameWidth / CARD_ASPECT_RATIO;
  const topPadding = Math.max(insets.top, Spacing.lg) + Spacing.sm;
  const bottomPadding = Math.max(insets.bottom, Spacing.lg) + Spacing.sm;

  const assignImage = (uri: string) => {
    const next = { ...images, [activeSide]: uri };
    const otherSide: CardSide = activeSide === "front" ? "back" : "front";

    setImages(next);

    if (!next[otherSide]) {
      setActiveSide(otherSide);
    }
  };

  const removeImage = (side: CardSide) => {
    setImages((current) => ({ ...current, [side]: null }));
    setActiveSide(side);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing || isIdentifying) {
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });

      if (photo?.uri) {
        assignImage(photo.uri);
      }
    } catch {
      Alert.alert(
        "Capture failed",
        "Could not take a photo on this device. Try picking from your library instead.",
      );
    } finally {
      setIsCapturing(false);
    }
  };

  // The system photo picker doesn't require a permission prompt on iOS or
  // Android, so it launches directly.
  const handlePickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (!result.canceled && result.assets?.[0]) {
      assignImage(result.assets[0].uri);
    }
  };

  const handleIdentify = async () => {
    if (!images.front || !images.back || isIdentifying) {
      return;
    }

    setIsIdentifying(true);

    try {
      const result = await scanService.identifyCard({
        frontUri: images.front,
        backUri: images.back,
      });

      Alert.alert(
        "Card identified",
        `${result.name} · ${result.setName}\nEstimated value $${result.price.toFixed(2)}`,
        [{ text: "Done", onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert("Scan failed", "Something went wrong. Please try again.");
    } finally {
      setIsIdentifying(false);
    }
  };

  const closeButton = (
    <IconButton
      accessibilityLabel="Close"
      icon={{ ios: "xmark", android: "close", web: "close" }}
      iconSize={scale(15)}
      onPress={() => navigation.goBack()}
      size={CONTROL_SIZE}
    />
  );

  // The scan button requests camera permission natively before navigating
  // here, so this fallback only appears if access was revoked mid-session.
  if (!permission?.granted) {
    return (
      <View style={[styles.root, { paddingTop: topPadding }]}>
        <View style={styles.fallbackHeader}>{closeButton}</View>
        <View style={styles.fallbackContent}>
          <Text style={styles.fallbackText}>
            Camera access is required to scan your card.
          </Text>
          <View style={styles.fallbackButtonContainer}>
            <AppButton
              label="Open Settings"
              onPress={() => Linking.openSettings()}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        facing="back"
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.mask}>
        <View style={styles.maskSection}>
          <View style={[styles.topBar, { paddingTop: topPadding }]}>
            {closeButton}
            <View style={styles.slotsRow}>
              {SIDES.map(({ side, label }) => (
                <ScanCardSide
                  key={side}
                  isActive={side === activeSide}
                  label={label}
                  onRemove={() => removeImage(side)}
                  onSelect={() => setActiveSide(side)}
                  side={side}
                  uri={images[side]}
                />
              ))}
            </View>
            <View style={styles.topBarSpacer} />
          </View>
        </View>

        <View style={[styles.maskMiddle, { height: frameHeight }]}>
          <View style={styles.maskFill} />
          <View style={[styles.frameOpening, { width: frameWidth }]}>
            <View style={[styles.bracket, styles.bracketTopLeft]} />
            <View style={[styles.bracket, styles.bracketTopRight]} />
            <View style={[styles.bracket, styles.bracketBottomLeft]} />
            <View style={[styles.bracket, styles.bracketBottomRight]} />
          </View>
          <View style={styles.maskFill} />
        </View>

        <View style={[styles.maskSection, styles.maskBottom]}>
          <Text style={styles.hint}>
            {isReady
              ? "Both sides captured"
              : `Position the ${activeSide} of your card in the frame`}
          </Text>

          <View style={[styles.bottomArea, { paddingBottom: bottomPadding }]}>
            {isReady ? (
              <View>
                <AppButton
                  disabled={!isReady || isIdentifying}
                  icon={{
                    ios: "arrow.right",
                    android: "arrow_forward",
                    web: "arrow_forward",
                  }}
                  label="Identify Card"
                  loading={isIdentifying}
                  onPress={handleIdentify}
                />
              </View>
            ) : null}

            <View style={styles.controlsRow}>
              <IconButton
                accessibilityLabel="Choose from library"
                icon={{
                  ios: "photo.on.rectangle",
                  android: "photo_library",
                  web: "photo_library",
                }}
                iconSize={scale(22)}
                onPress={handlePickFromLibrary}
                size={CONTROL_SIZE}
              />

              <Pressable
                accessibilityLabel={`Take photo of card ${activeSide}`}
                accessibilityRole="button"
                disabled={isCapturing || isIdentifying}
                onPress={handleCapture}
                style={({ pressed }) => [
                  styles.shutter,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.shutterInner,
                    isCapturing && styles.shutterInnerCapturing,
                  ]}
                />
              </Pressable>

              <View style={styles.controlsSpacer} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mask: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  maskSection: {
    flex: 1,
    backgroundColor: DIM_COLOR,
  },
  maskMiddle: {
    flexDirection: "row",
  },
  frameOpening: {
    borderRadius: Radii.md,
    borderCurve: "continuous",
  },
  maskFill: {
    flex: 1,
    backgroundColor: DIM_COLOR,
  },
  maskBottom: {
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  topBarSpacer: {
    width: CONTROL_SIZE,
  },
  slotsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  bracket: {
    position: "absolute",
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderColor: Colors.primary,
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
  },
  hint: {
    ...Typography.body,
    color: Colors.text,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  bottomArea: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: Radii.full,
    borderWidth: scale(4),
    borderColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: SHUTTER_SIZE - scale(16),
    height: SHUTTER_SIZE - scale(16),
    borderRadius: Radii.full,
    backgroundColor: Colors.text,
  },
  shutterInnerCapturing: {
    opacity: 0.5,
  },
  controlsSpacer: {
    width: CONTROL_SIZE,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  fallbackHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
  },
  fallbackContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.lg,
  },
  fallbackText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: "center",
  },
  fallbackButtonContainer: {
    width: "100%",
    maxWidth: scale(240),
  },
});

export default ScanCardScreen;
