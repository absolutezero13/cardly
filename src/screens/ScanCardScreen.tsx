import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from "react-native-vision-camera";

import AppButton from "@/components/AppButton";
import CaptureTransferAnimation, {
  type CaptureTransfer,
  type MeasuredRect,
} from "@/components/CaptureTransferAnimation";
import IconButton from "@/components/IconButton";
import ScanCardSide from "@/components/ScanCardSide";
import ScanLoadingScreen from "@/components/ScanLoadingScreen";
import type { RootStackParamList } from "@/navigation/RootNavigation";
import { AnalyticsEvent, analyticsService } from "@/services/analytics";
import scanService, { ScanCardError } from "@/services/scan";
import {
  Colors,
  Radii,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";

type CardSide = "front" | "back";
type ZoomLevel = 1 | 2;

const SIDES: { side: CardSide; label: string }[] = [
  { side: "front", label: "Front" },
  { side: "back", label: "Back" },
];

const CARD_ASPECT_RATIO = 0.72;
const FRAME_WIDTH_RATIO = 0.74;
const DIM_COLOR = withOpacity(Colors.cameraOverlay, 0.55);
const BRACKET_SIZE = scale(30);
const BRACKET_THICKNESS = scale(3.5);
const SHUTTER_SIZE = scale(76);
const CONTROL_SIZE = scale(52);
const SIDE_CONTROL_WIDTH = scale(92);
const ZOOM_LEVELS: ZoomLevel[] = [1, 2];

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: "images",
  allowsEditing: true,
  quality: 0.6,
};

const ScanCardScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { hasPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const frameRef = useRef<View>(null);
  const sideRefs = useRef<Record<CardSide, View | null>>({
    front: null,
    back: null,
  });
  const cameraDevice = useCameraDevice("back", {
    physicalDevices: ["wide-angle-camera"],
  });
  const cameraFormat = useCameraFormat(cameraDevice, [
    { photoResolution: { width: 1280, height: 960 } },
    { photoAspectRatio: 4 / 3 },
  ]);

  const [images, setImages] = useState<Record<CardSide, string | null>>({
    front: null,
    back: null,
  });
  const [activeSide, setActiveSide] = useState<CardSide>("front");
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [isTorchEnabled, setIsTorchEnabled] = useState(false);
  const [transferProgress] = useState(() => new Animated.Value(0));
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [captureTransfer, setCaptureTransfer] =
    useState<CaptureTransfer | null>(null);

  const isReady = Boolean(images.front && images.back);
  const frameWidth = width * FRAME_WIDTH_RATIO;
  const frameHeight = frameWidth / CARD_ASPECT_RATIO;
  const topPadding = Math.max(insets.top, Spacing.lg) + Spacing.sm;
  const bottomPadding = Math.max(insets.bottom, Spacing.lg) + Spacing.sm;
  const cameraZoom = cameraDevice
    ? Math.min(Math.max(zoomLevel, cameraDevice.minZoom), cameraDevice.maxZoom)
    : 1;
  const captureHint = isReady
    ? "Both sides captured"
    : images.front && !images.back
      ? "Front captured — now scan the back"
      : images.back && !images.front
        ? "Back captured — now scan the front"
        : `Position the ${activeSide} of your card in the frame`;

  const measureView = (view: View | null) =>
    new Promise<MeasuredRect | null>((resolve) => {
      if (!view) {
        resolve(null);
        return;
      }

      view.measureInWindow((x, y, width, height) => {
        resolve(width && height ? { x, y, width, height } : null);
      });
    });

  const assignImage = async (uri: string, capturedSide = activeSide) => {
    const [start, end] = await Promise.all([
      measureView(frameRef.current),
      measureView(sideRefs.current[capturedSide]),
    ]);

    if (start && end) {
      setIsTransferring(true);
      transferProgress.setValue(0);
      setCaptureTransfer({ uri, start, end });

      await new Promise<void>((resolve) => {
        Animated.timing(transferProgress, {
          toValue: 1,
          duration: 420,
          easing: Easing.bezier(0.2, 0, 0, 1),
          useNativeDriver: true,
        }).start(() => resolve());
      });
    }

    const next = { ...images, [capturedSide]: uri };
    const otherSide: CardSide = capturedSide === "front" ? "back" : "front";

    setImages(next);
    setCaptureTransfer(null);
    setIsTransferring(false);

    if (!next[otherSide]) {
      setActiveSide(otherSide);
    }
  };

  const removeImage = (side: CardSide) => {
    setImages((current) => ({ ...current, [side]: null }));
    setActiveSide(side);
  };

  const handleCapture = async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isCapturing ||
      isIdentifying
    ) {
      return;
    }

    const capturedSide = activeSide;
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
        enableAutoDistortionCorrection: false,
      });
      const photoUri = photo.path.startsWith("file://")
        ? photo.path
        : `file://${photo.path}`;

      await assignImage(photoUri, capturedSide);
      analyticsService.logEvent(AnalyticsEvent.CardImageAdded, {
        side: capturedSide,
        source: "camera",
      });
    } catch {
      analyticsService.logEvent(AnalyticsEvent.ActionError, {
        action: "capture",
        message: "Could not take a photo on this device.",
      });
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
    if (isCapturing || isTransferring || isIdentifying) {
      return;
    }

    const pickedSide = activeSide;
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (!result.canceled && result.assets?.[0]) {
      await assignImage(result.assets[0].uri, pickedSide);
      analyticsService.logEvent(AnalyticsEvent.CardImageAdded, {
        side: pickedSide,
        source: "gallery",
      });
    }
  };

  const handleIdentify = async () => {
    if (!images.front || !images.back || isIdentifying) {
      return;
    }

    setIsIdentifying(true);
    const startedAt = Date.now();

    try {
      const result = await scanService.identifyCard({
        frontUri: images.front,
        backUri: images.back,
      });

      analyticsService.logEvent(AnalyticsEvent.ScanSucceeded, {
        rarity: result.rarity,
        price: result.price,
        confidence: result.confidence,
        durationMs: Date.now() - startedAt,
      });
      navigation.replace("CardDetail", {
        kind: "scanResult",
        result,
        frontUri: images.front,
        backUri: images.back,
      });
    } catch (error) {
      const message =
        error instanceof ScanCardError
          ? error.message
          : "Something went wrong. Please try again.";

      analyticsService.logEvent(AnalyticsEvent.ScanFailed, {
        code: error instanceof ScanCardError ? error.code : undefined,
        message,
        durationMs: Date.now() - startedAt,
      });
      Alert.alert("Scan failed", message);
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
  if (!hasPermission) {
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

  if (isIdentifying && images.front && images.back) {
    return <ScanLoadingScreen frontUri={images.front} backUri={images.back} />;
  }

  if (!cameraDevice) {
    return (
      <View style={[styles.root, { paddingTop: topPadding }]}>
        <View style={styles.fallbackHeader}>{closeButton}</View>
        <View style={styles.fallbackContent}>
          <Text style={styles.fallbackText}>No back camera was found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        device={cameraDevice}
        format={cameraFormat}
        isActive
        onInitialized={() => setIsCameraReady(true)}
        onStopped={() => setIsCameraReady(false)}
        photo
        photoQualityBalance="speed"
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        torch={isTorchEnabled && cameraDevice.hasTorch ? "on" : "off"}
        zoom={cameraZoom}
      />

      <View
        pointerEvents={isTransferring ? "none" : "auto"}
        style={styles.mask}
      >
        <View style={styles.maskSection}>
          <View style={[styles.topBar, { paddingTop: topPadding }]}>
            {closeButton}
            <View style={styles.slotsRow}>
              {SIDES.map(({ side, label }) => (
                <ScanCardSide
                  isActive={side === activeSide}
                  key={side}
                  ref={(view) => {
                    sideRefs.current[side] = view;
                  }}
                  label={label}
                  onRemove={() => removeImage(side)}
                  onSelect={() => setActiveSide(side)}
                  side={side}
                  uri={images[side]}
                />
              ))}
            </View>
            <IconButton
              accessibilityLabel={`Turn flash ${isTorchEnabled ? "off" : "on"}`}
              disabled={
                !cameraDevice.hasTorch ||
                isCapturing ||
                isTransferring ||
                isIdentifying
              }
              icon={
                isTorchEnabled
                  ? { ios: "bolt.fill", android: "flash_on", web: "flash_on" }
                  : {
                      ios: "bolt.slash",
                      android: "flash_off",
                      web: "flash_off",
                    }
              }
              iconSize={scale(19)}
              onPress={() => setIsTorchEnabled((current) => !current)}
              size={CONTROL_SIZE}
              tintColor={isTorchEnabled ? Colors.primary : Colors.text}
            />
          </View>
          <Text style={styles.hint}>{captureHint}</Text>
        </View>

        <View style={[styles.maskMiddle, { height: frameHeight }]}>
          <View style={styles.maskFill} />
          <View
            collapsable={false}
            ref={frameRef}
            style={[styles.frameOpening, { width: frameWidth }]}
          >
            <View style={[styles.bracket, styles.bracketTopLeft]} />
            <View style={[styles.bracket, styles.bracketTopRight]} />
            <View style={[styles.bracket, styles.bracketBottomLeft]} />
            <View style={[styles.bracket, styles.bracketBottomRight]} />
          </View>
          <View style={styles.maskFill} />
        </View>

        <View style={[styles.maskSection, styles.maskBottom]}>
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
              <View style={styles.sideControl}>
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
              </View>

              <Pressable
                accessibilityLabel={`Take photo of card ${activeSide}`}
                accessibilityRole="button"
                disabled={isCapturing || isTransferring || isIdentifying}
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

              <View style={[styles.sideControl, styles.sideControlEnd]}>
                <View style={styles.zoomControl}>
                  {ZOOM_LEVELS.map((level) => {
                    const isActive = zoomLevel === level;

                    return (
                      <Pressable
                        key={level}
                        accessibilityLabel={`${level} times zoom`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        disabled={
                          isCapturing ||
                          isTransferring ||
                          isIdentifying ||
                          (level === 2 && cameraDevice.maxZoom < 2)
                        }
                        onPress={() => setZoomLevel(level)}
                        style={({ pressed }) => [
                          styles.zoomOption,
                          isActive && styles.zoomOptionActive,
                          pressed && styles.zoomOptionPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.zoomLabel,
                            isActive && styles.zoomLabelActive,
                          ]}
                        >
                          {level}×
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {captureTransfer ? (
        <CaptureTransferAnimation
          progress={transferProgress}
          transfer={captureTransfer}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
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
    justifyContent: "flex-end",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
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
  zoomControl: {
    alignSelf: "center",
    flexDirection: "row",
    padding: scale(4),
    gap: scale(2),
    borderRadius: Radii.full,
    borderCurve: "continuous",
    backgroundColor: withOpacity(Colors.surface, 0.82),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoomOption: {
    minWidth: scale(44),
    height: scale(36),
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomOptionActive: {
    backgroundColor: Colors.text,
  },
  zoomOptionPressed: {
    opacity: 0.75,
  },
  zoomLabel: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  zoomLabelActive: {
    color: Colors.black,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sideControl: {
    width: SIDE_CONTROL_WIDTH,
    alignItems: "flex-start",
  },
  sideControlEnd: {
    alignItems: "flex-end",
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
