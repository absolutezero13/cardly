import { SymbolView } from "expo-symbols";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import type { UserCollection } from "@/services/collections";
import {
  Colors,
  Radii,
  Spacing,
  Typography,
  scale,
} from "@/theme/Theme";

export type PopoverAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CollectionActionsPopoverProps = {
  anchor: PopoverAnchor | null;
  collection: UserCollection | null;
  onClose: () => void;
  onDelete: (collection: UserCollection) => void;
};

const POPOVER_WIDTH = scale(210);
const POPOVER_HEIGHT = scale(112);

const CollectionActionsPopover = ({
  anchor,
  collection,
  onClose,
  onDelete,
}: CollectionActionsPopoverProps) => {
  const { width, height } = useWindowDimensions();

  if (!anchor || !collection) {
    return null;
  }

  const left = Math.min(
    Math.max(Spacing.md, anchor.x + anchor.width - POPOVER_WIDTH),
    width - POPOVER_WIDTH - Spacing.md,
  );
  const belowAnchor = anchor.y + anchor.height + Spacing.xs;
  const top =
    belowAnchor + POPOVER_HEIGHT > height - Spacing.lg
      ? Math.max(Spacing.lg, anchor.y - POPOVER_HEIGHT - Spacing.xs)
      : belowAnchor;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close collection actions"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.popover, { left, top }]}>
          <Text numberOfLines={1} style={styles.collectionName}>
            {collection.name}
          </Text>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            onPress={() => onDelete(collection)}
            style={styles.deleteAction}
          >
            <SymbolView
              name={{ ios: "trash", android: "delete", web: "delete" }}
              size={scale(18)}
              tintColor={Colors.danger}
            />
            <Text style={styles.deleteLabel}>Delete Collection</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  popover: {
    position: "absolute",
    width: POPOVER_WIDTH,
    minHeight: POPOVER_HEIGHT,
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: Colors.surfaceElevated,
    boxShadow: "0 16px 42px rgba(0, 0, 0, 0.42)",
  },
  collectionName: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: scale(12),
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  deleteAction: {
    minHeight: scale(40),
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  deleteLabel: {
    ...Typography.button,
    color: Colors.danger,
    fontSize: scale(15),
  },
});

export default CollectionActionsPopover;
