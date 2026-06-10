import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius } from "@/src/shared/theme/Colors";

/**
 * Versão `.web.tsx` do AppBottomSheet: o `@gorhom/bottom-sheet` depende
 * de reanimated worklets que não rodam no Static Rendering do Expo
 * Router. No web caímos num `<Modal>` simples com backdrop + grab handle
 * — mesmo contrato de props que a versão nativa.
 */
export function AppBottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  snapPoint?: string;
  children: React.ReactNode;
}) {
  const palette = usePalette();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: palette.shadow }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.grab, { backgroundColor: palette.outline }]} />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    maxHeight: "85%",
  },
  grab: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
});
