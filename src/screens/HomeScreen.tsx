import { Alert, ScrollView, StyleSheet } from "react-native";

import CardSection from "@/components/cards/CardSection";
import IconButton from "@/components/IconButton";
import Screen from "@/components/Screen";
import { popularCards, trendingCards } from "@/data/mockCards";
import auth from "@/services/auth";
import { Colors, Layout, Spacing, scale } from "@/theme/Theme";

const HomeScreen = () => {
  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Failed to sign out", error);
      Alert.alert(
        "Sign out failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You’ll return to Welcome.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  };

  return (
    <Screen
      title="Home"
      subtitle="Track what's hot and what collectors are chasing."
      headerRight={
        __DEV__ ? (
          <IconButton
            accessibilityLabel="Sign out"
            icon="power"
            onPress={confirmSignOut}
            size={Layout.minimumTouchSize}
            tintColor={Colors.danger}
          />
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CardSection cards={trendingCards} title="Trending" />
        <CardSection cards={popularCards} title="Most Popular" />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: Layout.sectionGap,
    paddingBottom: scale(120),
    paddingTop: Spacing.lg,
  },
});

export default HomeScreen;
