import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import IconButton from "@/components/IconButton";
import type { RootStackParamList } from "@/navigation/RootNavigation";
import cardService, { CardServiceError, cardImageUri } from "@/services/cards";
import useCardsStore from "@/stores/CardsStore";
import useUserStore from "@/stores/UserStore";
import { rarityLabels } from "@/types/card";
import { formatScanDate } from "@/utils/format";
import {
  Colors,
  Layout,
  Radii,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";

type Props = NativeStackScreenProps<RootStackParamList, "CardDetail">;

const CardDetailScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const params = route.params;
  const isScanResult = params.kind === "scanResult";
  const card = isScanResult ? params.result : params.card;
  const frontUri = isScanResult
    ? params.frontUri
    : cardImageUri(params.card.frontImageUrl);
  const backUri = isScanResult
    ? params.backUri
    : cardImageUri(params.card.backImageUrl);
  const scanDate = isScanResult ? null : formatScanDate(params.card.createdAt);
  const ownerId = useUserStore((state) => state.user?.uid);
  const addCard = useCardsStore((state) => state.addCard);
  const [cardSwapProgress] = useState(() => new Animated.Value(0));
  const [isBackActive, setIsBackActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const confidence = Math.round(
    Math.min(1, Math.max(0, card.confidence)) * 100,
  );
  const price = card.price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: card.price >= 100 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const close = () => navigation.popTo("HomeTabs");
  const requestClose = () => {
    if (!isScanResult) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      "Discard analysis?",
      "This analysis has not been saved and will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: close },
      ],
    );
  };
  const handleSave = async () => {
    if (params.kind !== "scanResult" || !ownerId || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const savedCard = await cardService.saveScannedCard(
        ownerId,
        params.result,
        {
          frontUri: params.frontUri,
          backUri: params.backUri,
        },
      );
      addCard(savedCard);
      close();
    } catch (error) {
      Alert.alert(
        "Could not save card",
        error instanceof CardServiceError ? error.message : "Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const swapCards = () => {
    const nextIsBackActive = !isBackActive;

    setIsBackActive(nextIsBackActive);
    Animated.timing(cardSwapProgress, {
      toValue: nextIsBackActive ? 1 : 0,
      duration: 420,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  const frontCardTransform = {
    transform: [
      {
        translateX: cardSwapProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, scale(108)],
        }),
      },
      {
        translateY: cardSwapProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, scale(150)],
        }),
      },
      {
        scale: cardSwapProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.32],
        }),
      },
      {
        rotate: cardSwapProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["-5deg", "9deg"],
        }),
      },
    ],
  };
  const backCardTransform = {
    transform: [
      {
        translateX: cardSwapProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [scale(108), 0],
        }),
      },
      {
        translateY: cardSwapProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [scale(150), 0],
        }),
      },
      {
        scale: cardSwapProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.32, 1],
        }),
      },
      {
        rotate: cardSwapProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["9deg", "-5deg"],
        }),
      },
    ],
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, Spacing.md),
            paddingBottom: Math.max(insets.bottom, Spacing.xl),
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardStage}>
          <Animated.View
            pointerEvents={isBackActive ? "auto" : "none"}
            style={[
              styles.imageSurface,
              frontCardTransform,
              { zIndex: isBackActive ? 3 : 2 },
            ]}
          >
            <Pressable
              accessibilityLabel="Show front of card"
              accessibilityRole="button"
              onPress={swapCards}
              style={styles.cardPressable}
            >
              {frontUri ? (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  source={{ uri: frontUri }}
                  style={styles.cardImage}
                />
              ) : (
                <View style={[styles.cardImage, styles.cardImageFallback]}>
                  <SymbolView
                    name={{ ios: "photo", android: "image", web: "image" }}
                    size={scale(32)}
                    tintColor={Colors.textMuted}
                  />
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents={isBackActive ? "none" : "auto"}
            style={[
              styles.imageSurface,
              backCardTransform,
              { zIndex: isBackActive ? 2 : 3 },
            ]}
          >
            <Pressable
              accessibilityLabel="Show back of card"
              accessibilityRole="button"
              onPress={swapCards}
              style={styles.cardPressable}
            >
              {backUri ? (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  source={{ uri: backUri }}
                  style={styles.cardImage}
                />
              ) : (
                <View style={[styles.cardImage, styles.cardImageFallback]}>
                  <SymbolView
                    name={{ ios: "photo", android: "image", web: "image" }}
                    size={scale(32)}
                    tintColor={Colors.textMuted}
                  />
                </View>
              )}
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.titleBlock}>
          <Text selectable style={styles.cardName}>
            {card.name}
          </Text>
          <Text selectable style={styles.setName}>
            {card.setName}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.featuredDetail}>
            <View>
              <Text style={styles.detailLabel}>ESTIMATED VALUE</Text>
              <Text selectable style={styles.price}>
                {price}
              </Text>
            </View>
            <SymbolView
              name={{
                ios: "chart.line.uptrend.xyaxis",
                android: "trending_up",
                web: "trending_up",
              }}
              size={scale(26)}
              tintColor={Colors.primary}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailName}>Rarity</Text>
            <Text selectable style={styles.detailValue}>
              {rarityLabels[card.rarity]}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailName}>Match confidence</Text>
            <Text selectable style={[styles.detailValue, styles.tabular]}>
              {confidence}%
            </Text>
          </View>
          {scanDate ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailName}>Scanned</Text>
              <Text selectable style={styles.detailValue}>
                {scanDate}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.note}>
          <SymbolView
            name={{ ios: "info.circle", android: "info", web: "info" }}
            size={scale(18)}
            tintColor={Colors.textMuted}
          />
          <Text style={styles.noteText}>
            Value is an AI estimate for an ungraded card, not a live market
            quote.
          </Text>
        </View>

        {isScanResult ? (
          <AppButton
            icon={{
              ios: "bookmark.fill",
              android: "bookmark",
              web: "bookmark",
            }}
            label="Save"
            loading={isSaving}
            onPress={() => void handleSave()}
          />
        ) : null}
      </ScrollView>

      <View style={[styles.closeButton]}>
        <IconButton
          accessibilityLabel="Close card detail"
          icon={{ ios: "xmark", android: "close", web: "close" }}
          iconSize={scale(15)}
          onPress={requestClose}
          size={scale(44)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: Spacing.xl,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  closeButton: {
    position: "absolute",
    right: Spacing.md,
    zIndex: 10,
    top: Spacing.md,
  },
  cardStage: {
    width: "100%",
    maxWidth: scale(360),
    height: scale(400),
    alignSelf: "center",
    alignItems: "center",
  },
  imageSurface: {
    position: "absolute",
    top: 0,
    width: "78%",
    maxWidth: scale(310),
    aspectRatio: 0.72,
    alignSelf: "center",
    padding: scale(5),
    borderRadius: Radii.lg,
    borderCurve: "continuous",
    backgroundColor: Colors.surfaceElevated,
    boxShadow: "0 18px 44px rgba(0, 0, 0, 0.3)",
  },
  cardPressable: {
    flex: 1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: Radii.lg - scale(5),
    borderWidth: 1,
    borderColor: withOpacity(Colors.white, 0.1),
  },
  cardImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  titleBlock: {
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  cardName: {
    ...Typography.title,
    color: Colors.text,
    fontSize: scale(25),
    lineHeight: scale(30),
    textAlign: "center",
  },
  setName: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
  detailsCard: {
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radii.lg,
    borderCurve: "continuous",
    backgroundColor: Colors.surface,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
  },
  featuredDetail: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: scale(11),
    fontWeight: "700",
    letterSpacing: scale(0.8),
  },
  price: {
    ...Typography.title,
    color: Colors.text,
    fontSize: scale(34),
    lineHeight: scale(42),
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  detailRow: {
    minHeight: scale(28),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.lg,
  },
  detailName: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
    textAlign: "right",
  },
  tabular: {
    fontVariant: ["tabular-nums"],
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: withOpacity(Colors.surfaceElevated, 0.7),
  },
  noteText: {
    ...Typography.caption,
    flex: 1,
    color: Colors.textMuted,
  },
});

export default CardDetailScreen;
