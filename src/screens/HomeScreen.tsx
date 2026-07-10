import { ScrollView, StyleSheet } from "react-native";

import CardSection from "@/components/cards/CardSection";
import Screen from "@/components/Screen";
import { popularCards, trendingCards } from "@/data/mockCards";
import { Layout, Spacing, scale } from "@/theme/Theme";

const HomeScreen = () => {
  return (
    <Screen
      title="Home"
      subtitle="Track what's hot and what collectors are chasing."
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
