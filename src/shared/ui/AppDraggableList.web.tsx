import React from "react";
import { FlatList, type FlatListProps, View } from "react-native";

/**
 * Versão `.web.tsx`: `react-native-draggable-flatlist` depende de
 * reanimated worklets que quebram o Static Rendering do Expo Router.
 * Fallback usa `<FlatList>` puro — sem drag, mas a tela continua
 * usável.
 *
 * Mantém o contrato de `renderItem({ item, drag, isActive, ... })`:
 * `drag` é no-op, `isActive` é `false`.
 */

export type RenderItemParams<T> = {
  item: T;
  drag: () => void;
  isActive: boolean;
  getIndex: () => number | undefined;
};

export type AppDraggableListProps<T> = {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (params: RenderItemParams<T>) => React.ReactElement | null;
  onDragEnd?: (params: { data: T[] }) => void;
  contentContainerStyle?: FlatListProps<T>["contentContainerStyle"];
  ListEmptyComponent?: FlatListProps<T>["ListEmptyComponent"];
};

const NOOP = () => {};

export function AppDraggableList<T>({
  data,
  keyExtractor,
  renderItem,
  contentContainerStyle,
  ListEmptyComponent,
}: AppDraggableListProps<T>) {
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      contentContainerStyle={contentContainerStyle}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item, index }) =>
        renderItem({
          item,
          drag: NOOP,
          isActive: false,
          getIndex: () => index,
        })
      }
    />
  );
}
