import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
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
import AppHeader, { getAppHeaderContentInset } from "@/components/AppHeader";
import HistoryCardItem from "@/components/cards/HistoryCardItem";
import { TAB_BAR_HEIGHT } from "@/navigation/constants";
import type { RootStackParamList } from "@/navigation/RootNavigation";
import cardService, { CardServiceError, type UserCard } from "@/services/cards";
import useCardsStore from "@/stores/CardsStore";
import useUserStore from "@/stores/UserStore";
import { Colors, Layout, Spacing, Typography, scale } from "@/theme/Theme";

const HistoryScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const ownerId = useUserStore((state) => state.user?.uid);
  const cards = useCardsStore((state) => state.cards);
  const status = useCardsStore((state) => state.status);
  const loadError = useCardsStore((state) => state.error);
  const ensureLoaded = useCardsStore((state) => state.ensureLoaded);
  const refresh = useCardsStore((state) => state.refresh);
  const removeCard = useCardsStore((state) => state.removeCard);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    // ensureLoaded refetches when status is idle/error (not when ready).
    await ensureLoaded(ownerId);
  };

  const deleteCard = async (card: UserCard) => {
    if (!ownerId || deletingId) {
      return;
    }

    setDeletingId(card._id);

    try {
      await cardService.deleteCard(ownerId, card);
      removeCard(card._id);
    } catch (error) {
      Alert.alert(
        "Could not delete card",
        error instanceof CardServiceError ? error.message : "Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const openCardDetail = (card: UserCard) => {
    navigation.navigate("CardDetail", { kind: "savedCard", card });
  };

  const requestDelete = (card: UserCard) => {
    Alert.alert(card.name, "Remove this card from your history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deleteCard(card),
      },
    ]);
  };

  const isLoading = status === "idle" || status === "loading";

  return (
    <View style={styles.root}>
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Loading your cards…</Text>
        </View>
      ) : status === "error" && cards.length === 0 ? (
        <View style={styles.centerState}>
          <Text selectable style={styles.errorText}>
            {loadError ?? "Could not load your cards."}
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
            { paddingTop: getAppHeaderContentInset(insets.top) },
          ]}
          data={cards}
          keyExtractor={(card) => card._id}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Text style={styles.stateText}>
                Cards you save after a scan will show up here.
              </Text>
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
              actionIcon={{ ios: "trash", android: "delete", web: "delete" }}
              card={item}
              isActionPending={deletingId === item._id}
              onAction={requestDelete}
              onPress={openCardDetail}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
      <AppHeader title="History" />
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
    paddingTop: Spacing.lg,
    paddingHorizontal: Layout.screenHorizontalPadding,
    paddingBottom: TAB_BAR_HEIGHT + scale(120),
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
  retryButtonContainer: {
    width: "100%",
    maxWidth: scale(220),
  },
});

export default HistoryScreen;
