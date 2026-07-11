import { Animated, StyleSheet } from "react-native";

import { Colors, Radii, withOpacity } from "@/theme/Theme";

export type MeasuredRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CaptureTransfer = {
  uri: string;
  start: MeasuredRect;
  end: MeasuredRect;
};

type CaptureTransferAnimationProps = {
  progress: Animated.Value;
  transfer: CaptureTransfer;
};

const centerDelta = (
  startPosition: number,
  startSize: number,
  endPosition: number,
  endSize: number,
) => endPosition + endSize / 2 - (startPosition + startSize / 2);

const CaptureTransferAnimation = ({
  progress,
  transfer,
}: CaptureTransferAnimationProps) => {
  const { start, end, uri } = transfer;
  const translateX = centerDelta(start.x, start.width, end.x, end.width);
  const translateY = centerDelta(start.y, start.height, end.y, end.height);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: start.x,
          top: start.y,
          width: start.width,
          height: start.height,
          opacity: progress.interpolate({
            inputRange: [0, 0.82, 1],
            outputRange: [0.96, 1, 0.94],
          }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, translateX],
              }),
            },
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, translateY],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, end.width / start.width],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.Image
        resizeMode="cover"
        source={{ uri }}
        style={styles.image}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 30,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceElevated,
    boxShadow: `0 14px 36px ${withOpacity(Colors.black, 0.32)}`,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: withOpacity(Colors.white, 0.12),
  },
});

export default CaptureTransferAnimation;
