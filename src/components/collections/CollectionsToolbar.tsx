import { SymbolView } from "expo-symbols";
import { StyleSheet, TextInput, View } from "react-native";

import IconButton from "@/components/IconButton";
import {
  Colors,
  Radii,
  Spacing,
  Typography,
  scale,
} from "@/theme/Theme";

export type CollectionViewMode = "grid" | "list";

type CollectionsToolbarProps = {
  query: string;
  viewMode: CollectionViewMode;
  onChangeQuery: (query: string) => void;
  onToggleViewMode: () => void;
};

const CollectionsToolbar = ({
  query,
  viewMode,
  onChangeQuery,
  onToggleViewMode,
}: CollectionsToolbarProps) => (
  <View style={styles.toolbar}>
    <View style={styles.searchField}>
      <SymbolView
        name={{ ios: "magnifyingglass", android: "search", web: "search" }}
        size={scale(20)}
        tintColor={Colors.textMuted}
      />
      <TextInput
        accessibilityLabel="Search collections"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeQuery}
        placeholder="Search collections"
        placeholderTextColor={Colors.textMuted}
        returnKeyType="search"
        style={styles.searchInput}
        value={query}
      />
    </View>
    <IconButton
      accessibilityLabel={
        viewMode === "grid"
          ? "Show collections as a list"
          : "Show collections as a grid"
      }
      icon={
        viewMode === "grid"
          ? { ios: "list.bullet", android: "view_list", web: "view_list" }
          : { ios: "square.grid.2x2", android: "grid_view", web: "grid_view" }
      }
      iconSize={scale(22)}
      onPress={onToggleViewMode}
      size={scale(50)}
    />
  </View>
);

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  searchField: {
    flex: 1,
    minHeight: scale(50),
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: Colors.surface,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    paddingVertical: 0,
    color: Colors.text,
    fontSize: scale(15),
    lineHeight: scale(22),
  },
});

export default CollectionsToolbar;
