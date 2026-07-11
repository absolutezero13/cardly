import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { cardImageUri, type UserCard } from "@/services/cards";
import { rarityLabels } from "@/types/card";
import {
  Colors,
  Radii,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";

type HistoryCardItemProps = {
  card: UserCard;
  isDeleting: boolean;
  onDelete: (card: UserCard) => void;
};

const formatPrice = (price: number) => {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  return `$${price.toFixed(price >= 100 ? 0 : 2)}`;
};

const formatScanDate = (createdAt: string) => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const HistoryCardItem = ({
  card,
  isDeleting,
  onDelete,
}: HistoryCardItemProps) => {
  const imageUri = cardImageUri(card.frontImageUrl);
  const scanDate = formatScanDate(card.createdAt);

  return (
    <View style={styles.row}>
      <View style={styles.thumbnailFrame}>
        {imageUri ? (
          <Image
            contentFit="cover"
            source={{ uri: imageUri }}
            style={styles.thumbnail}
            transition={200}
          />
        ) : (
          <SymbolView
            name={{ ios: "photo", android: "image", web: "image" }}
            size={scale(20)}
            tintColor={Colors.textMuted}
          />
        )}
      </View>

      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {card.name}
        </Text>
        <Text numberOfLines={1} style={styles.setName}>
          {card.setName}
        </Text>
        <Text numberOfLines={1} style={styles.caption}>
          {scanDate
            ? `${rarityLabels[card.rarity]} · ${scanDate}`
            : rarityLabels[card.rarity]}
        </Text>
      </View>

      <View style={styles.trailing}>
        <Text style={styles.price}>{formatPrice(card.price)}</Text>
        {isDeleting ? (
          <ActivityIndicator color={Colors.danger} size="small" />
        ) : (
          <Pressable
            accessibilityLabel={`Delete ${card.name}`}
            accessibilityRole="button"
            hitSlop={scale(8)}
            onPress={() => onDelete(card)}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deletePressed,
            ]}
          >
            <SymbolView
              name={{ ios: "trash", android: "delete", web: "delete" }}
              size={scale(16)}
              tintColor={Colors.danger}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  thumbnailFrame: {
    width: scale(56),
    aspectRatio: 0.72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.sm,
    borderCurve: "continuous",
    backgroundColor: Colors.surfaceElevated,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: withOpacity(Colors.white, 0.1),
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    ...Typography.button,
    color: Colors.text,
  },
  setName: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  caption: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  trailing: {
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  price: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  deleteButton: {
    width: scale(32),
    height: scale(32),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.full,
    backgroundColor: withOpacity(Colors.danger, 0.12),
  },
  deletePressed: {
    backgroundColor: withOpacity(Colors.danger, 0.24),
  },
});

export default HistoryCardItem;
