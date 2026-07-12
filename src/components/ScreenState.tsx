import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import AppButton from "@/components/AppButton";
import { Colors, Layout, Spacing, Typography, scale } from "@/theme/Theme";

type ScreenStateProps =
  | {
      kind: "loading";
      message: string;
    }
  | {
      kind: "error";
      message: string;
      onRetry?: () => void;
    };

const ScreenState = (props: ScreenStateProps) => (
  <View style={styles.container}>
    {props.kind === "loading" ? (
      <ActivityIndicator color={Colors.primary} />
    ) : null}
    <Text
      selectable={props.kind === "error"}
      style={props.kind === "error" ? styles.errorText : styles.message}
    >
      {props.message}
    </Text>
    {props.kind === "error" && props.onRetry ? (
      <View style={styles.retryButtonContainer}>
        <AppButton label="Try Again" onPress={props.onRetry} />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  message: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: scale(15),
    lineHeight: scale(22),
    textAlign: "center",
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    fontSize: scale(15),
    lineHeight: scale(22),
    textAlign: "center",
  },
  retryButtonContainer: {
    width: "100%",
    maxWidth: scale(220),
  },
});

export default ScreenState;
