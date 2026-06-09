import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius } from "@/src/shared/theme/Colors";

/**
 * Wrapper sobre `@gorhom/bottom-sheet` que reproduz a API "visible
 * controlado por state" que os sheets antigos (M-04 antes) usavam com
 * `<Modal>`. Cada callsite só troca o JSX de Modal pra AppBottomSheet —
 * a lógica de state segue igual.
 *
 * Comportamento:
 *  - `visible=true`  → expande até `snapPoint`.
 *  - `visible=false` → fecha (animado).
 *  - Swipe-down sobre o sheet → dispara `onClose` (gorhom nativo).
 *  - Tap no backdrop escuro → dispara `onClose` (`pressBehavior="close"`).
 *
 * `snapPoint` é uma string aceita pelo gorhom (`"50%"`, `"75%"`,
 * `"CONTENT_HEIGHT"` etc.). Default = "60%" — suficiente pros sheets
 * deste app.
 */
export function AppBottomSheet({
  visible,
  onClose,
  snapPoint = "60%",
  children,
}: {
  visible: boolean;
  onClose: () => void;
  snapPoint?: string;
  children: React.ReactNode;
}) {
  const palette = usePalette();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [snapPoint], [snapPoint]);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: palette.surface,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
      }}
      handleIndicatorStyle={{ backgroundColor: palette.outline }}
    >
      <BottomSheetView style={styles.content}>{children}</BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
