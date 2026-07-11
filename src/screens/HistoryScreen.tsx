import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppButton from "@/components/AppButton";
import HistoryCardItem from "@/components/cards/HistoryCardItem";
import Screen from "@/components/Screen";
import { TAB_BAR_HEIGHT } from "@/navigation/constants";
import type { RootStackParamList } from "@/navigation/RootNavigation";
import cardService, {
  CardServiceError,
  type UserCard,
} from "@/services/cards";
import useUserStore from "@/stores/UserStore";
import { Colors, Layout, Spacing, Typography, scale } from "@/theme/Theme";

const HistoryScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const ownerId = useUserStore((state) => state.user?.uid);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Refetch on focus so cards saved from the scan flow show up immediately.
  useFocusEffect(
    useCallback(() => {
      if (!ownerId) {
        return;
      }

      const controller = new AbortController();

      const loadCards = async () => {
        try {
          const nextCards = await cardService.listCards(
            ownerId,
            controller.signal,
          );

          if (!controller.signal.aborted) {
            setCards(nextCards);
            setLoadError(null);
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            setLoadError(
              error instanceof CardServiceError
                ? error.message
                : "Could not load your cards.",
            );
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      };

      void loadCards();

      return () => controller.abort();
    }, [ownerId]),
  );

  const reloadCards = async (refresh = false) => {
    if (!ownerId) {
      return;
    }

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const nextCards = await cardService.listCards(ownerId);
      setCards(nextCards);
    } catch (error) {
      setLoadError(
        error instanceof CardServiceError
          ? error.message
          : "Could not load your cards.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const deleteCard = async (card: UserCard) => {
    if (!ownerId || deletingId) {
      return;
    }

    setDeletingId(card._id);

    try {
      await cardService.deleteCard(ownerId, card);
      setCards((current) => current.filter((item) => item._id !== card._id));
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

  return (
    <Screen title="History">
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Loading your cards…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerState}>
          <Text selectable style={styles.errorText}>
            {loadError}
          </Text>
          <View style={styles.retryButtonContainer}>
            <AppButton label="Try Again" onPress={() => void reloadCards()} />
          </View>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
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
              card={item}
              isDeleting={deletingId === item._id}
              onDelete={requestDelete}
              onPress={openCardDetail}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
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
