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
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import CollectionActionsPopover, {
  type PopoverAnchor,
} from "@/components/collections/CollectionActionsPopover";
import CollectionItem from "@/components/collections/CollectionItem";
import CollectionsToolbar, {
  type CollectionViewMode,
} from "@/components/collections/CollectionsToolbar";
import CreateCollectionModal from "@/components/collections/CreateCollectionModal";
import { TAB_BAR_HEIGHT } from "@/navigation/constants";
import collectionService, {
  CollectionServiceError,
  type UserCollection,
} from "@/services/collections";
import useUserStore from "@/stores/UserStore";
import {
  Colors,
  Layout,
  Spacing,
  Typography,
  scale,
} from "@/theme/Theme";

type CollectionListItem =
  | { kind: "create" }
  | { kind: "collection"; collection: UserCollection };

const CREATE_ITEM: CollectionListItem = { kind: "create" };

const CollectionsScreen = () => {
  const ownerId = useUserStore((state) => state.user?.uid);
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
        const nextCollections = await collectionService.listCollections(
          ownerId,
          controller.signal,
        );

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

    void loadInitialCollections();

    return () => controller.abort();
  }, [ownerId]);

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
      ...filteredCollections.map(
        (collection): CollectionListItem => ({
          kind: "collection",
          collection,
        }),
      ),
      CREATE_ITEM,
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
      const nextCollections = await collectionService.listCollections(ownerId);
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
      const collection = await collectionService.createCollection(ownerId, name);
      setCollections((current) => [...current, collection]);
      setIsCreateVisible(false);
      setCollectionName("");
    } catch (error) {
      Alert.alert(
        "Could not create collection",
        error instanceof CollectionServiceError
          ? error.message
          : "Please try again.",
      );
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
      Alert.alert(
        "Could not delete collection",
        error instanceof CollectionServiceError
          ? error.message
          : "Please try again.",
      );
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

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Collections</Text>
        <CollectionsToolbar
          onChangeQuery={setQuery}
          onToggleViewMode={() =>
            setViewMode((current) => (current === "grid" ? "list" : "grid"))
          }
          query={query}
          viewMode={viewMode}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Loading collections…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerState}>
          <Text selectable style={styles.errorText}>
            {loadError}
          </Text>
          <View style={styles.retryButtonContainer}>
            <AppButton label="Try Again" onPress={() => reloadCollections()} />
          </View>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          data={items}
          keyExtractor={(item) =>
            item.kind === "create" ? "create" : item.collection._id
          }
          numColumns={viewMode === "grid" ? 2 : 1}
          refreshControl={
            <RefreshControl
              onRefresh={() => reloadCollections(true)}
              refreshing={isRefreshing}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <CollectionItem
              collection={
                item.kind === "collection" ? item.collection : undefined
              }
              isDeleting={
                item.kind === "collection" &&
                deletingId === item.collection._id
              }
              onCreate={() => setIsCreateVisible(true)}
              onMore={openCollectionActions}
              viewMode={viewMode}
            />
          )}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Layout.screenVerticalPadding,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
    fontSize: scale(27),
    lineHeight: scale(33),
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
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Layout.screenHorizontalPadding,
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

export default CollectionsScreen;
