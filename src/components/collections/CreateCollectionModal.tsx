import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppButton from "@/components/AppButton";
import {
  Colors,
  Layout,
  Radii,
  Spacing,
  Typography,
  scale,
  withOpacity,
} from "@/theme/Theme";

type CreateCollectionModalProps = {
  isCreating: boolean;
  name: string;
  visible: boolean;
  onChangeName: (name: string) => void;
  onClose: () => void;
  onCreate: () => void;
};

const CreateCollectionModal = ({
  isCreating,
  name,
  visible,
  onChangeName,
  onClose,
  onCreate,
}: CreateCollectionModalProps) => (
  <Modal
    animationType="fade"
    onRequestClose={onClose}
    statusBarTranslucent
    transparent
    visible={visible}
  >
    <View style={styles.modalRoot}>
      <Pressable
        accessibilityLabel="Close create collection popup"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>New Collection</Text>
        <TextInput
          accessibilityLabel="Collection name"
          autoCapitalize="words"
          autoFocus
          editable={!isCreating}
          maxLength={80}
          onChangeText={onChangeName}
          onSubmitEditing={onCreate}
          placeholder="Collection name"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="done"
          style={styles.nameInput}
          value={name}
        />
        <View style={styles.modalActions}>
          <Pressable
            accessibilityRole="button"
            disabled={isCreating}
            onPress={onClose}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
          <View style={styles.createButtonContainer}>
            <AppButton
              disabled={!name.trim()}
              label="Create"
              loading={isCreating}
              onPress={onCreate}
            />
          </View>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Layout.screenHorizontalPadding,
    backgroundColor: withOpacity(Colors.black, 0.68),
    paddingBottom: scale(72),
  },
  modalCard: {
    width: "100%",
    maxWidth: scale(420),
    gap: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: Radii.lg,
    borderCurve: "continuous",
    backgroundColor: Colors.surfaceElevated,
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: scale(22),
    lineHeight: scale(28),
  },
  nameInput: {
    ...Typography.body,
    minHeight: scale(52),
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    color: Colors.text,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: scale(15),
    lineHeight: scale(18),
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cancelButton: {
    minWidth: scale(82),
    minHeight: scale(52),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.md,
  },
  cancelLabel: {
    ...Typography.button,
    color: Colors.textMuted,
    fontSize: scale(15),
  },
  createButtonContainer: {
    flex: 1,
  },
});

export default CreateCollectionModal;
