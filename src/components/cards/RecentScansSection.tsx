import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { cardImageUri, type UserCard } from "@/services/cards";
import {
  Colors,
  Layout,
  Radii,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";
import { formatPrice } from "@/utils/format";

type RecentScansSectionProps = {
  cards: UserCard[];
  onPressCard: (card: UserCard) => void;
};

const RecentScansSection = ({ cards, onPressCard }: RecentScansSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Recent scans</Text>
    <FlatList
      contentContainerStyle={styles.listContent}
      data={cards}
      horizontal
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyExtractor={(card) => card._id}
      renderItem={({ item }) => {
        const imageUri = cardImageUri(item.frontImageUrl);

        return (
          <Pressable
            onPress={() => onPressCard(item)}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.imageFrame}>
              {imageUri ? (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  source={{ uri: imageUri }}
                  style={styles.image}
                />
              ) : (
                <SymbolView
                  name={{ ios: "photo", android: "image", web: "image" }}
                  size={scale(28)}
                  tintColor={Colors.textMuted}
                />
              )}
            </View>
            <View style={styles.cardCopy}>
              <Text numberOfLines={1} style={styles.cardName}>
                {item.name}
              </Text>
              <Text numberOfLines={1} style={styles.setName}>
                {item.setName}
              </Text>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </View>
          </Pressable>
        );
      }}
      showsHorizontalScrollIndicator={false}
    />
  </View>
);

const styles = StyleSheet.create({
  section: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.button,
    color: Colors.text,
    fontSize: scale(18),
    lineHeight: scale(24),
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  listContent: {
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  separator: {
    width: Spacing.md,
  },
  card: {
    width: scale(132),
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
  },
  imageFrame: {
    width: "100%",
    aspectRatio: 0.72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: Colors.surface,
    boxShadow: `0 10px 24px ${withOpacity(Colors.black, 0.2)}`,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: Radii.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: withOpacity(Colors.white, 0.1),
  },
  cardCopy: {
    gap: Spacing.xs,
    paddingTop: Spacing.md,
  },
  cardName: {
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

export default RecentScansSection;
