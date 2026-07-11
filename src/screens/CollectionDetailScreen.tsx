import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import HistoryCardItem from "@/components/cards/HistoryCardItem";
import IconButton from "@/components/IconButton";
import type { RootStackParamList } from "@/navigation/RootNavigation";
import cardService, { CardServiceError, type UserCard } from "@/services/cards";
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

type Props = NativeStackScreenProps<RootStackParamList, "CollectionDetail">;

const titleForParams = (params: Props["route"]["params"]) => {
  if (params.kind === "favorite") {
    return "Favorites";
  }

  return params.name;
};

const CollectionDetailScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const ownerId = useUserStore((state) => state.user?.uid);
  const params = route.params;
  const title = titleForParams(params);
  const allCards = useCardsStore((state) => state.cards);
  const status = useCardsStore((state) => state.status);
  const loadError = useCardsStore((state) => state.error);
  const ensureLoaded = useCardsStore((state) => state.ensureLoaded);
  const refresh = useCardsStore((state) => state.refresh);
  const upsertCard = useCardsStore((state) => state.upsertCard);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cards = useMemo(
    () =>
      allCards.filter((card) =>
        params.kind === "favorite"
          ? card.isFavorite
          : card.collectionId === params.collectionId,
      ),
    [allCards, params],
  );

  useEffect(() => {
    if (!ownerId) {
      return;
    }

    void ensureLoaded(ownerId);
  }, [ensureLoaded, ownerId]);

  const reloadCards = async (pullToRefresh = false) => {
    if (!ownerId) {
      return;
    }

    if (pullToRefresh) {
      setIsRefreshing(true);

      try {
        await refresh(ownerId);
      } catch (error) {
        Alert.alert(
          "Could not refresh",
          error instanceof CardServiceError
            ? error.message
            : "Please try again.",
        );
      } finally {
        setIsRefreshing(false);
      }

      return;
    }

    await ensureLoaded(ownerId);
  };

  const removeCardFromCollection = async (card: UserCard) => {
    if (!ownerId || deletingId) {
      return;
    }

    setDeletingId(card._id);

    try {
      const updatedCard = await cardService.updateCard(ownerId, card._id, {
        ...(params.kind === "favorite"
          ? { isFavorite: false }
          : { collectionId: null }),
      });
      upsertCard(updatedCard);
    } catch (error) {
      Alert.alert(
        "Could not remove card",
        error instanceof CardServiceError ? error.message : "Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const openCardDetail = (card: UserCard) => {
    navigation.navigate("CardDetail", { kind: "savedCard", card });
  };

  const openAddCards = () => {
    navigation.navigate("AddCardsToCollection", params);
  };

  const requestDelete = (card: UserCard) => {
    Alert.alert(
      card.name,
      params.kind === "favorite"
        ? "Remove this card from Favorites?"
        : "Remove this card from your collection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => void removeCardFromCollection(card),
        },
      ],
    );
  };

  const isLoading = status === "idle" || status === "loading";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <IconButton
          accessibilityLabel="Go back"
          icon={{
            ios: "chevron.left",
            android: "arrow_back",
            web: "arrow_back",
          }}
          iconSize={scale(20)}
          onPress={() => navigation.goBack()}
          size={scale(40)}
        />
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {cards.length > 0 ? (
          <IconButton
            accessibilityLabel="Add cards"
            icon={{ ios: "plus", android: "add", web: "add" }}
            iconSize={scale(20)}
            onPress={openAddCards}
            size={scale(40)}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Loading cards…</Text>
        </View>
      ) : status === "error" && allCards.length === 0 ? (
        <View style={styles.centerState}>
          <Text selectable style={styles.errorText}>
            {loadError ?? "Could not load cards in this collection."}
          </Text>
          <View style={styles.retryButtonContainer}>
            <AppButton
              label="Try Again"
              onPress={() => void reloadCards(false)}
            />
          </View>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          data={cards}
          keyExtractor={(card) => card._id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyArtwork}>
                <View style={[styles.cardSilhouette, styles.cardBehindLeft]} />
                <View style={[styles.cardSilhouette, styles.cardBehindRight]} />
                <View style={styles.cardFront}>
                  <View style={styles.emptyIcon}>
                    <SymbolView
                      name={{ ios: "plus", android: "add", web: "add" }}
                      size={scale(24)}
                      tintColor={Colors.primary}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>Build your collection</Text>
                <Text style={styles.emptySubtitle}>
                  Choose saved cards from your history and keep them organized
                  here.
                </Text>
              </View>
              <View style={styles.emptyButtonContainer}>
                <AppButton
                  label="Add Cards"
                  accessibilityLabel="Add cards to collection"
                  icon={{ ios: "plus", android: "add", web: "add" }}
                  onPress={openAddCards}
                />
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => void reloadCards(true)}
              refreshing={isRefreshing}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <HistoryCardItem
              actionIcon={{
                ios: "minus.circle",
                android: "remove_circle",
                web: "remove_circle",
              }}
              card={item}
              isActionPending={deletingId === item._id}
              onAction={requestDelete}
              onPress={openCardDetail}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: Layout.minimumTouchSize,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Layout.screenHorizontalPadding,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
    flex: 1,
    color: Colors.text,
    fontSize: scale(24),
    lineHeight: scale(30),
  },
  headerSpacer: {
    width: scale(40),
    height: scale(40),
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    paddingVertical: scale(56),
  },
  emptyArtwork: {
    width: scale(150),
    height: scale(142),
    alignItems: "center",
    justifyContent: "center",
  },
  cardSilhouette: {
    position: "absolute",
    width: scale(76),
    height: scale(108),
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: withOpacity(Colors.white, 0.08),
  },
  cardBehindLeft: {
    transform: [{ translateX: scale(-27) }, { rotate: "-10deg" }],
  },
  cardBehindRight: {
    transform: [{ translateX: scale(27) }, { rotate: "10deg" }],
  },
  cardFront: {
    width: scale(86),
    height: scale(122),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(19),
    borderCurve: "continuous",
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: withOpacity(Colors.primary, 0.28),
  },
  emptyIcon: {
    width: scale(48),
    height: scale(48),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.full,
    backgroundColor: withOpacity(Colors.primary, 0.14),
  },
  emptyCopy: {
    alignItems: "center",
    gap: Spacing.sm,
    maxWidth: scale(310),
  },
  emptyTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: scale(22),
    lineHeight: scale(28),
    textAlign: "center",
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: scale(14),
    lineHeight: scale(21),
    textAlign: "center",
  },
  emptyButtonContainer: {
    width: "100%",
    maxWidth: scale(240),
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
  retryButtonContainer: {
    width: "100%",
    maxWidth: scale(220),
  },
});

export default CollectionDetailScreen;
