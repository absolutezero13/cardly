import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppHeader, { getAppHeaderContentInset } from "@/components/AppHeader";
import CollectionActionsPopover, {
  type PopoverAnchor,
} from "@/components/collections/CollectionActionsPopover";
import CollectionItem from "@/components/collections/CollectionItem";
import CollectionsToolbar, {
  type CollectionViewMode,
} from "@/components/collections/CollectionsToolbar";
import CreateCollectionModal from "@/components/collections/CreateCollectionModal";
import ScreenState from "@/components/ScreenState";
import { TAB_BAR_HEIGHT } from "@/navigation/constants";
import type {
  CollectionDetailParams,
  RootStackParamList,
} from "@/navigation/RootNavigation";
import { AnalyticsEvent, analyticsService } from "@/services/analytics";
import { cardImageUri } from "@/services/cards";
import collectionService, {
  CollectionServiceError,
  type UserCollection,
} from "@/services/collections";
import useCardsStore from "@/stores/CardsStore";
import useUserStore from "@/stores/UserStore";
import { Colors, Layout, Spacing, scale } from "@/theme/Theme";

type CollectionListItem =
  | { kind: "create" }
  | { kind: "collection"; collection: UserCollection }
  | {
      kind: "favorite";
    };

const CREATE_ITEM: CollectionListItem = { kind: "create" };
const FAVORITE_ITEM: CollectionListItem = { kind: "favorite" };

const CollectionsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const ownerId = useUserStore((state) => state.user?.uid);
  const cards = useCardsStore((state) => state.cards);
  const cardsStatus = useCardsStore((state) => state.status);
  const ensureCardsLoaded = useCardsStore((state) => state.ensureLoaded);
  const refreshCards = useCardsStore((state) => state.refresh);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<CollectionViewMode>("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeActions, setActiveActions] = useState<{
    collection: UserCollection;
    anchor: PopoverAnchor;
  } | null>(null);

  useEffect(() => {
    if (!ownerId) {
      return;
    }

    const controller = new AbortController();

    const loadInitialCollections = async () => {
      try {
        const [nextCollections] = await Promise.all([
          collectionService.listCollections(ownerId, controller.signal),
          ensureCardsLoaded(ownerId),
        ]);

        if (!controller.signal.aborted) {
          setCollections(nextCollections);
          setLoadError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof CollectionServiceError
              ? error.message
              : "Could not load your collections.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialCollections();

    return () => controller.abort();
  }, [ensureCardsLoaded, ownerId]);

  const cardCounts = useMemo(() => {
    const counts = new Map<string, number>();

    cards.forEach((card) => {
      if (card.collectionId) {
        counts.set(card.collectionId, (counts.get(card.collectionId) ?? 0) + 1);
      }
    });

    return counts;
  }, [cards]);
  const favoriteCount = useMemo(
    () => cards.filter((card) => card.isFavorite).length,
    [cards],
  );

  const cardPreviews = useMemo(() => {
    const previews = new Map<string, string[]>();

    cards.forEach((card) => {
      if (!card.collectionId) {
        return;
      }

      const imageUri = cardImageUri(card.frontImageUrl);
      const collectionPreviews = previews.get(card.collectionId) ?? [];

      if (imageUri && collectionPreviews.length < 3) {
        collectionPreviews.push(imageUri);
        previews.set(card.collectionId, collectionPreviews);
      }
    });

    return previews;
  }, [cards]);

  const filteredCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return collections;
    }

    return collections.filter((collection) =>
      collection.name.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [collections, query]);

  const items = useMemo<CollectionListItem[]>(
    () => [
      FAVORITE_ITEM,
      CREATE_ITEM,
      ...filteredCollections.map(
        (collection): CollectionListItem => ({
          kind: "collection",
          collection,
        }),
      ),
    ],
    [filteredCollections],
  );

  const reloadCollections = async (refresh = false) => {
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
      const [nextCollections] = await Promise.all([
        collectionService.listCollections(ownerId),
        refreshCards(ownerId),
      ]);
      setCollections(nextCollections);
    } catch (error) {
      setLoadError(
        error instanceof CollectionServiceError
          ? error.message
          : "Could not load your collections.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const closeCreateModal = () => {
    if (!isCreating) {
      setIsCreateVisible(false);
      setCollectionName("");
    }
  };

  const handleCreate = async () => {
    const name = collectionName.trim();

    if (!ownerId || !name || isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      const collection = await collectionService.createCollection(
        ownerId,
        name,
      );
      setCollections((current) => [...current, collection]);
      setIsCreateVisible(false);
      setCollectionName("");
    } catch (error) {
      const message =
        error instanceof CollectionServiceError
          ? error.message
          : "Please try again.";

      analyticsService.logEvent(AnalyticsEvent.ActionError, {
        action: "collection_create",
        message,
      });
      Alert.alert("Could not create collection", message);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteCollection = async (collection: UserCollection) => {
    if (!ownerId || deletingId) {
      return;
    }

    setDeletingId(collection._id);

    try {
      await collectionService.deleteCollection(ownerId, collection._id);
      setCollections((current) =>
        current.filter((item) => item._id !== collection._id),
      );
    } catch (error) {
      const message =
        error instanceof CollectionServiceError
          ? error.message
          : "Please try again.";

      analyticsService.logEvent(AnalyticsEvent.ActionError, {
        action: "collection_delete",
        message,
      });
      Alert.alert("Could not delete collection", message);
    } finally {
      setDeletingId(null);
    }
  };

  const openCollectionActions = (
    collection: UserCollection,
    anchor: PopoverAnchor,
  ) => {
    setActiveActions({ collection, anchor });
  };

  const openCollectionDetail = (params: CollectionDetailParams) => {
    navigation.navigate("CollectionDetail", params);
  };

  const requestDelete = (collection: UserCollection) => {
    setActiveActions(null);
    Alert.alert(collection.name, "Delete this collection?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteCollection(collection),
      },
    ]);
  };

  const renderCollectionItem = (item: CollectionListItem) => {
    let cardCount: number | undefined;

    if (cardsStatus === "ready") {
      if (item.kind === "favorite") {
        cardCount = favoriteCount;
      } else if (item.kind === "collection") {
        cardCount = cardCounts.get(item.collection._id) ?? 0;
      }
    }

    let onPress: (() => void) | undefined;

    if (item.kind === "favorite") {
      onPress = () => openCollectionDetail({ kind: "favorite" });
    } else if (item.kind === "collection") {
      onPress = () =>
        openCollectionDetail({
          kind: "collection",
          collectionId: item.collection._id,
          name: item.collection.name,
        });
    }

    return (
      <CollectionItem
        collection={item.kind === "collection" ? item.collection : undefined}
        cardCount={cardCount}
        cardPreviewUris={
          item.kind === "collection"
            ? cardPreviews.get(item.collection._id)
            : undefined
        }
        isDeleting={
          item.kind === "collection" && deletingId === item.collection._id
        }
        kind={item.kind}
        onCreate={() => setIsCreateVisible(true)}
        onMore={openCollectionActions}
        onPress={onPress}
        viewMode={viewMode}
      />
    );
  };

  const hasLoadError = !isLoading && Boolean(loadError);
  const shouldShowCollections = !isLoading && !hasLoadError;

  return (
    <View style={styles.root}>
      {isLoading && (
        <ScreenState kind="loading" message="Loading collections…" />
      )}
      {hasLoadError && (
        <ScreenState
          kind="error"
          message={loadError ?? "Could not load collections."}
          onRetry={() => reloadCollections()}
        />
      )}
      {shouldShowCollections && (
        <FlatList
          key={viewMode}
          columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: getAppHeaderContentInset(insets.top) },
          ]}
          data={items}
          keyExtractor={(item) =>
            item.kind === "collection" ? item.collection._id : item.kind
          }
          numColumns={viewMode === "grid" ? 2 : 1}
          ListHeaderComponent={
            <CollectionsToolbar
              onChangeQuery={setQuery}
              onToggleViewMode={() =>
                setViewMode((current) => (current === "grid" ? "list" : "grid"))
              }
              query={query}
              viewMode={viewMode}
            />
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => reloadCollections(true)}
              refreshing={isRefreshing}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => renderCollectionItem(item)}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CreateCollectionModal
        isCreating={isCreating}
        name={collectionName}
        onChangeName={setCollectionName}
        onClose={closeCreateModal}
        onCreate={handleCreate}
        visible={isCreateVisible}
      />
      <CollectionActionsPopover
        anchor={activeActions?.anchor ?? null}
        collection={activeActions?.collection ?? null}
        onClose={() => setActiveActions(null)}
        onDelete={requestDelete}
      />
      <AppHeader title="Collections" />
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
    paddingHorizontal: Layout.screenHorizontalPadding,
    paddingBottom: TAB_BAR_HEIGHT + scale(120),
  },
  gridRow: {
    gap: Spacing.md,
  },
});

export default CollectionsScreen;
