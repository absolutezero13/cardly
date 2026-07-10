import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TradingCard as TradingCardType } from "@/types/card";
import {
  Colors,
  Layout,
  Radii,
  Spacing,
  Typography,
  scale,
} from "@/theme/Theme";

const CARD_WIDTH = scale(140);
const CARD_HEIGHT = scale(196);

type TradingCardProps = {
  card: TradingCardType;
  onPress?: () => void;
};

const rarityLabels: Record<TradingCardType["rarity"], string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  mythic: "Mythic",
};

const formatPrice = (price: number) => {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  return `$${price.toFixed(price >= 100 ? 0 : 2)}`;
};

const TradingCard = ({ card, onPress }: TradingCardProps) => {
  return (
    <Pressable
      accessibilityLabel={card.name}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.artFrame}>
        <Image
          contentFit="cover"
          source={card.imageSource}
          style={styles.artImage}
          transition={200}
        />
        <View style={styles.rarityBadge}>
          <Text style={styles.rarityText}>{rarityLabels[card.rarity]}</Text>
        </View>
        {card.trend !== undefined ? (
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>+{card.trend.toFixed(1)}%</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={2} style={styles.name}>
          {card.name}
        </Text>
        <Text numberOfLines={1} style={styles.setName}>
          {card.setName}
        </Text>
        <Text style={styles.price}>{formatPrice(card.price)}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  artFrame: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  artImage: {
    width: "100%",
    height: "100%",
    borderRadius: Radii.md - 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  rarityBadge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    backgroundColor: "rgba(7, 17, 31, 0.72)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rarityText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: "600",
  },
  trendBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    backgroundColor: "rgba(94, 143, 232, 0.24)",
    borderWidth: 1,
    borderColor: "rgba(94, 143, 232, 0.4)",
  },
  trendText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  meta: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
    minHeight: Layout.minimumTouchSize,
  },
  name: {
    ...Typography.button,
    color: Colors.text,
  },
  setName: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  price: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});

export default TradingCard;
