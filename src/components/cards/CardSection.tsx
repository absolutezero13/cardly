import { FlatList, StyleSheet, Text, View } from "react-native";

import TradingCard from "@/components/cards/TradingCard";
import { Colors, Layout, Spacing, Typography } from "@/theme/Theme";
import type { TradingCard as TradingCardType } from "@/types/card";

type CardSectionProps = {
  title: string;
  cards: TradingCardType[];
};

const CardSection = ({ title, cards }: CardSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        horizontal
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TradingCard card={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: Spacing.lg,
  },
  title: {
    ...Typography.button,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    color: Colors.text,
    fontWeight: "700",
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  listContent: {
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  separator: {
    width: Spacing.md,
  },
});

export default CardSection;
