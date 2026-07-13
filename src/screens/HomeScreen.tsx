import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import AppHeader, { getAppHeaderContentInset } from "@/components/AppHeader";
import RecentScansSection from "@/components/cards/RecentScansSection";
import IconButton from "@/components/IconButton";
import ScreenState from "@/components/ScreenState";
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
  const insets = useSafeAreaInsets();
  const ownerId = useUserStore((state) => state.user?.uid);
  const cards = useCardsStore((state) => state.cards);
  const cardsStatus = useCardsStore((state) => state.status);
  const cardsError = useCardsStore((state) => state.error);
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

  const signOut = useCallback(async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Failed to sign out", error);
      Alert.alert(
        "Sign out failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }, []);

  const confirmSignOut = useCallback(() => {
    Alert.alert("Sign out?", "You’ll return to Welcome.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  }, [signOut]);

  const isLoadingCards = cardsStatus === "idle" || cardsStatus === "loading";
  const hasCardsError = cardsStatus === "error" && cards.length === 0;
  const showCards = !isLoadingCards && !hasCardsError;

  const retryCards = () => {
    if (ownerId) {
      void ensureCardsLoaded(ownerId);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: getAppHeaderContentInset(insets.top) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Your collection, at a glance.</Text>
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
              {isLoadingCards || hasCardsError ? "—" : cards.length}
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
          <View style={styles.screenState}>
            <ScreenState kind="loading" message="Loading your cards…" />
          </View>
        ) : null}
        {hasCardsError ? (
          <View style={styles.screenState}>
            <ScreenState
              kind="error"
              message={cardsError ?? "Could not load your cards."}
              onRetry={retryCards}
            />
          </View>
        ) : null}
        {showCards && recentCards.length > 0 ? (
          <RecentScansSection
            cards={recentCards}
            onPressCard={(card) =>
              navigation.navigate("CardDetail", { kind: "savedCard", card })
            }
          />
        ) : null}
        {showCards && recentCards.length === 0 ? (
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
        ) : null}
      </ScrollView>
      <AppHeader
        rightAction={
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
        title="Home"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    gap: Layout.sectionGap,
    paddingBottom: scale(140),
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    paddingHorizontal: Layout.screenHorizontalPadding,
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
  screenState: {
    minHeight: scale(220),
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
