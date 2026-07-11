import { SymbolView } from "expo-symbols";
import { useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PopoverAnchor } from "@/components/collections/CollectionActionsPopover";
import type { CollectionViewMode } from "@/components/collections/CollectionsToolbar";
import IconButton from "@/components/IconButton";
import type { UserCollection } from "@/services/collections";
import {
  Colors,
  Radii,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";

export type CollectionItemKind = "create" | "collection" | "favorite";

type CollectionItemProps = {
  kind: CollectionItemKind;
  collection?: UserCollection;
  isDeleting?: boolean;
  viewMode: CollectionViewMode;
  onCreate: () => void;
  onMore: (collection: UserCollection, anchor: PopoverAnchor) => void;
};

const CollectionItem = ({
  kind,
  collection,
  isDeleting = false,
  viewMode,
  onCreate,
  onMore,
}: CollectionItemProps) => {
  const moreButtonRef = useRef<View>(null);

  const handleMore = (targetCollection: UserCollection) => {
    moreButtonRef.current?.measureInWindow((x, y, width, height) => {
      onMore(targetCollection, { x, y, width, height });
    });
  };

  if (viewMode === "list") {
    if (kind === "create") {
      return (
        <Pressable
          accessibilityLabel="Create collection"
          accessibilityRole="button"
          onPress={onCreate}
          style={[styles.listRow, styles.createListRow]}
        >
          <View style={styles.listIcon}>
            <SymbolView
              name={{ ios: "plus", android: "add", web: "add" }}
              size={scale(22)}
              tintColor={Colors.text}
            />
          </View>
          <Text style={styles.listCreateLabel}>Create New</Text>
        </Pressable>
      );
    }

    if (kind === "favorite") {
      return (
        <View style={styles.listRow}>
          <View style={[styles.listIcon, styles.favoriteIcon]}>
            <SymbolView
              name={{ ios: "star.fill", android: "star", web: "star" }}
              size={scale(22)}
              tintColor={Colors.primary}
            />
          </View>
          <View style={styles.listCopy}>
            <Text numberOfLines={1} style={styles.listCollectionName}>
              Favorites
            </Text>
            <Text style={styles.cardCount}>0 cards</Text>
          </View>
        </View>
      );
    }

    if (!collection) {
      return null;
    }

    return (
      <View style={styles.listRow}>
        <View style={styles.listIcon}>
          <SymbolView
            name={{ ios: "folder", android: "folder", web: "folder" }}
            size={scale(22)}
            tintColor={Colors.primary}
          />
        </View>
        <View style={styles.listCopy}>
          <Text numberOfLines={1} style={styles.listCollectionName}>
            {collection.name}
          </Text>
          <Text style={styles.cardCount}>0 cards</Text>
        </View>
        <View
          ref={moreButtonRef}
          collapsable={false}
          style={styles.listMoreButton}
        >
          {isDeleting ? (
            <ActivityIndicator color={Colors.textMuted} size="small" />
          ) : (
            <IconButton
              accessibilityLabel={`More actions for ${collection.name}`}
              icon={{
                ios: "ellipsis",
                android: "more_horiz",
                web: "more_horiz",
              }}
              iconSize={scale(21)}
              onPress={() => handleMore(collection)}
              size={scale(44)}
              tintColor={Colors.textMuted}
            />
          )}
        </View>
      </View>
    );
  }

  if (kind === "create") {
    return (
      <Pressable
        accessibilityLabel="Create collection"
        accessibilityRole="button"
        onPress={onCreate}
        style={[styles.gridCard, styles.createCard]}
      >
        <View style={styles.createIcon}>
          <SymbolView
            name={{ ios: "plus", android: "add", web: "add" }}
            size={scale(27)}
            tintColor={Colors.text}
          />
        </View>
        <Text style={styles.createLabel}>Create New</Text>
      </Pressable>
    );
  }

  if (kind === "favorite") {
    return (
      <View style={styles.gridCard}>
        <View style={styles.gridArtwork}>
          <SymbolView
            name={{ ios: "star.fill", android: "star", web: "star" }}
            size={scale(54)}
            tintColor={withOpacity(Colors.primary, 0.72)}
          />
        </View>
        <View style={styles.gridCopy}>
          <Text numberOfLines={2} style={styles.collectionName}>
            Favorites
          </Text>
          <Text style={styles.cardCount}>0 cards</Text>
        </View>
      </View>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <View style={styles.gridCard}>
      <View style={styles.gridArtwork}>
        <SymbolView
          name={{ ios: "folder", android: "folder", web: "folder" }}
          size={scale(54)}
          tintColor={withOpacity(Colors.textMuted, 0.48)}
        />
      </View>
      <View style={styles.gridCopy}>
        <Text numberOfLines={2} style={styles.collectionName}>
          {collection.name}
        </Text>
        <Text style={styles.cardCount}>0 cards</Text>
      </View>
      <View ref={moreButtonRef} collapsable={false} style={styles.moreButton}>
        {isDeleting ? (
          <ActivityIndicator color={Colors.textMuted} size="small" />
        ) : (
          <IconButton
            accessibilityLabel={`More actions for ${collection.name}`}
            icon={{
              ios: "ellipsis",
              android: "more_horiz",
              web: "more_horiz",
            }}
            iconSize={scale(20)}
            onPress={() => handleMore(collection)}
            size={scale(40)}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    maxWidth: "48%",
    minHeight: scale(214),
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderCurve: "continuous",
    backgroundColor: Colors.surface,
    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.18)",
  },
  createCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primary,
  },
  createIcon: {
    width: scale(58),
    height: scale(58),
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withOpacity(Colors.background, 0.45),
  },
  createLabel: {
    ...Typography.button,
    color: Colors.text,
    fontSize: scale(16),
  },
  gridArtwork: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCopy: {
    gap: Spacing.xs,
  },
  collectionName: {
    ...Typography.button,
    color: Colors.text,
    fontSize: scale(16),
  },
  cardCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: scale(12),
    lineHeight: scale(16),
    fontVariant: ["tabular-nums"],
  },
  moreButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: scale(40),
    height: scale(40),
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  listRow: {
    minHeight: scale(78),
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: Colors.surface,
  },
  createListRow: {
    backgroundColor: Colors.primary,
  },
  listIcon: {
    width: scale(46),
    height: scale(46),
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withOpacity(Colors.white, 0.08),
  },
  favoriteIcon: {
    backgroundColor: withOpacity(Colors.primary, 0.14),
  },
  listCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  listCollectionName: {
    ...Typography.button,
    color: Colors.text,
    fontSize: scale(15),
  },
  listCreateLabel: {
    ...Typography.button,
    flex: 1,
    color: Colors.text,
    fontSize: scale(15),
  },
  listMoreButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CollectionItem;
