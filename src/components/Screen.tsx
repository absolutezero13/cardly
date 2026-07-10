import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Layout, Typography } from "@/theme/Theme";

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

const Screen = ({ title, subtitle, children }: ScreenProps) => {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingTop: Layout.screenVerticalPadding,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Layout.sectionGap,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
});

export default Screen;
