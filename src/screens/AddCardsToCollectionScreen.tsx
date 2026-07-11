import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import AppHeader, { getAppHeaderContentInset } from "@/components/AppHeader";
import IconButton from "@/components/IconButton";
import type { RootStackParamList } from "@/navigation/RootNavigation";
import cardService, { CardServiceError, cardImageUri } from "@/services/cards";
import useCardsStore from "@/stores/CardsStore";
import useUserStore from "@/stores/UserStore";
import {
  Colors,
  Layout,
  Radii,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";
import { rarityLabels } from "@/types/card";
import { formatPrice } from "@/utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "AddCardsToCollection">;

const titleForParams = (params: Props["route"]["params"]) => {
  if (params.kind === "favorite") {
    return "Add to Favorites";
  }

  return `Add to ${params.name}`;
};

const AddCardsToCollectionScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const ownerId = useUserStore((state) => state.user?.uid);
  const params = route.params;
  const allCards = useCardsStore((state) => state.cards);
  const status = useCardsStore((state) => state.status);
  const loadError = useCardsStore((state) => state.error);
  const ensureLoaded = useCardsStore((state) => state.ensureLoaded);
  const upsertCard = useCardsStore((state) => state.upsertCard);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isSaving, setIsSaving] = useState(false);

  const cards = useMemo(
    () =>
      allCards.filter((card) =>
        params.kind === "favorite"
          ? !card.isFavorite
          : card.collectionId !== params.collectionId,
      ),
    [allCards, params],
  );

  useEffect(() => {
    if (!ownerId) {
      return;
    }

    void ensureLoaded(ownerId);
  }, [ensureLoaded, ownerId]);

  const selectedCount = selectedIds.size;
  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) {
      return "Add cards";
    }

    if (selectedCount === 1) {
      return "Add 1 card";
    }

    return `Add ${selectedCount} cards`;
  }, [selectedCount]);

  const toggleCard = (cardId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }

      return next;
    });
  };

  const handleAdd = async () => {
    if (!ownerId || selectedCount === 0 || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedCards = await Promise.all(
        [...selectedIds].map((cardId) =>
          cardService.updateCard(ownerId, cardId, {
            ...(params.kind === "favorite"
              ? { isFavorite: true }
              : { collectionId: params.collectionId }),
          }),
        ),
      );

      updatedCards.forEach((card) => upsertCard(card));
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Could not add cards",
        error instanceof CardServiceError ? error.message : "Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = status === "idle" || status === "loading";

  return (
    <View style={styles.root}>
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Loading your cards…</Text>
        </View>
      ) : status === "error" && allCards.length === 0 ? (
        <View style={styles.centerState}>
          <Text selectable style={styles.errorText}>
            {loadError ?? "Could not load your cards."}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: getAppHeaderContentInset(insets.top),
                paddingBottom: Math.max(insets.bottom, Spacing.md) + scale(88),
              },
            ]}
            data={cards}
            keyExtractor={(card) => card._id}
            ListEmptyComponent={
              <View style={styles.centerState}>
                <Text style={styles.emptyTitle}>No cards to add</Text>
                <Text style={styles.stateText}>
                  Scan and save cards first, then add them to this collection.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const imageUri = cardImageUri(item.frontImageUrl);
              const isSelected = selectedIds.has(item._id);

              return (
                <Pressable
                  accessibilityLabel={item.name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => toggleCard(item._id)}
                  style={({ pressed }) => [
                    styles.row,
                    isSelected && styles.rowSelected,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.thumbnailFrame}>
                    {imageUri ? (
                      <Image
                        cachePolicy="memory-disk"
                        contentFit="cover"
                        source={{ uri: imageUri }}
                        style={styles.thumbnail}
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
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.setName}>
                      {item.setName}
                    </Text>
                    <Text numberOfLines={1} style={styles.caption}>
                      {rarityLabels[item.rarity]} · {formatPrice(item.price)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected ? (
                      <SymbolView
                        name={{
                          ios: "checkmark",
                          android: "check",
                          web: "check",
                        }}
                        size={scale(14)}
                        tintColor={Colors.text}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
            showsVerticalScrollIndicator={false}
          />

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            ]}
          >
            <AppButton
              disabled={selectedCount === 0}
              label={selectedLabel}
              loading={isSaving}
              onPress={() => void handleAdd()}
            />
          </View>
        </>
      )}
      <AppHeader
        isModalScreen
        rightAction={
          <IconButton
            accessibilityLabel="Close"
            icon={{ ios: "xmark", android: "close", web: "close" }}
            iconSize={scale(18)}
            onPress={() => navigation.goBack()}
            size={scale(40)}
          />
        }
        title={titleForParams(params)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    flexGrow: 1,
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  emptyTitle: {
    ...Typography.button,
    color: Colors.text,
    fontSize: scale(18),
    lineHeight: scale(24),
  },
  stateText: {
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
  rowSelected: {
    borderColor: withOpacity(Colors.primary, 0.55),
    backgroundColor: withOpacity(Colors.primary, 0.1),
  },
  rowPressed: {
    backgroundColor: Colors.surfaceElevated,
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
  checkbox: {
    width: scale(24),
    height: scale(24),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: withOpacity(Colors.white, 0.28),
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Layout.screenHorizontalPadding,
    paddingTop: Spacing.md,
    backgroundColor: withOpacity(Colors.background, 0.94),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default AddCardsToCollectionScreen;
