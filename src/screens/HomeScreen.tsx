import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import RecentScansSection from "@/components/cards/RecentScansSection";
import AppButton from "@/components/AppButton";
import IconButton from "@/components/IconButton";
import Screen from "@/components/Screen";
import useOpenScanCard from "@/hooks/useOpenScanCard";
import type { RootStackParamList } from "@/navigation/RootNavigation";
import auth from "@/services/auth";
import collectionService from "@/services/collections";
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

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const ownerId = useUserStore((state) => state.user?.uid);
  const cards = useCardsStore((state) => state.cards);
  const cardsStatus = useCardsStore((state) => state.status);
  const ensureCardsLoaded = useCardsStore((state) => state.ensureLoaded);
  const [collectionCount, setCollectionCount] = useState<number | null>(null);
  const openScanCard = useOpenScanCard();

  useEffect(() => {
    if (ownerId) {
      void ensureCardsLoaded(ownerId);
    }
  }, [ensureCardsLoaded, ownerId]);

  useFocusEffect(
    useCallback(() => {
      if (!ownerId) {
        return;
      }

      let isActive = true;

      void collectionService
        .listCollections(ownerId)
        .then((collections) => {
          if (isActive) {
            setCollectionCount(collections.length);
          }
        })
        .catch(() => {
          if (isActive) {
            setCollectionCount(null);
          }
        });

      return () => {
        isActive = false;
      };
    }, [ownerId]),
  );

  const recentCards = useMemo(
    () =>
      [...cards]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )
        .slice(0, 5),
    [cards],
  );

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Failed to sign out", error);
      Alert.alert(
        "Sign out failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You’ll return to Welcome.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  };

  const isLoadingCards = cardsStatus === "idle" || cardsStatus === "loading";

  return (
    <Screen
      title="Home"
      subtitle="Your collection, at a glance."
      headerRight={
        __DEV__ ? (
          <IconButton
            accessibilityLabel="Sign out"
            icon="power"
            onPress={confirmSignOut}
            size={Layout.minimumTouchSize}
            tintColor={Colors.danger}
          />
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <SymbolView
              name={{
                ios: "rectangle.stack",
                android: "style",
                web: "style",
              }}
              size={scale(21)}
              tintColor={Colors.primary}
            />
            <Text style={styles.statValue}>
              {isLoadingCards ? "—" : cards.length}
            </Text>
            <Text style={styles.statLabel}>Cards scanned</Text>
          </View>
          <View style={styles.statCard}>
            <SymbolView
              name={{ ios: "folder", android: "folder", web: "folder" }}
              size={scale(21)}
              tintColor={Colors.primary}
            />
            <Text style={styles.statValue}>{collectionCount ?? "—"}</Text>
            <Text style={styles.statLabel}>Collections</Text>
          </View>
        </View>

        {isLoadingCards ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your cards…</Text>
          </View>
        ) : recentCards.length > 0 ? (
          <RecentScansSection
            cards={recentCards}
            onPressCard={(card) =>
              navigation.navigate("CardDetail", { kind: "savedCard", card })
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <SymbolView
                name={{
                  ios: "barcode.viewfinder",
                  android: "document_scanner",
                  web: "document_scanner",
                }}
                size={scale(30)}
                tintColor={Colors.primary}
              />
            </View>
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>No cards yet</Text>
              <Text style={styles.emptyText}>
                Scan your first card to start building your collection.
              </Text>
            </View>
            <View style={styles.emptyButtonContainer}>
              <AppButton
                label="Scan Your First Card"
                icon={{
                  ios: "barcode.viewfinder",
                  android: "document_scanner",
                  web: "document_scanner",
                }}
                onPress={() => void openScanCard()}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    gap: Layout.sectionGap,
    paddingBottom: scale(140),
    paddingTop: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  statCard: {
    flex: 1,
    minHeight: scale(132),
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: Colors.surface,
    boxShadow: `0 8px 24px ${withOpacity(Colors.black, 0.16)}`,
  },
  statValue: {
    ...Typography.title,
    color: Colors.text,
    fontSize: scale(28),
    lineHeight: scale(32),
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  loadingState: {
    flex: 1,
    minHeight: scale(220),
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  emptyState: {
    minHeight: scale(280),
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    marginHorizontal: Layout.screenHorizontalPadding,
    padding: Spacing.xl,
    borderRadius: Radii.lg,
    borderCurve: "continuous",
    backgroundColor: withOpacity(Colors.primary, 0.07),
    borderWidth: 1,
    borderColor: withOpacity(Colors.primary, 0.16),
  },
  emptyIcon: {
    width: scale(64),
    height: scale(64),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.full,
    backgroundColor: withOpacity(Colors.primary, 0.14),
  },
  emptyCopy: {
    alignItems: "center",
    gap: Spacing.sm,
    maxWidth: scale(280),
  },
  emptyButtonContainer: {
    width: "100%",
    maxWidth: scale(250),
  },
  emptyTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: scale(22),
    lineHeight: scale(28),
    textAlign: "center",
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: scale(14),
    lineHeight: scale(21),
    textAlign: "center",
  },
});

export default HomeScreen;
