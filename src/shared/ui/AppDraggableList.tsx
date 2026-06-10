import React from "react";
import type { FlatListProps } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";

/**
 * Wrapper sobre `react-native-draggable-flatlist` (M-07). No nativo
 * delega tudo pro lib; no web (.web.tsx) cai num `<FlatList>` simples
 * sem drag — a lib usa reanimated worklets que quebram o Static
 * Rendering do Expo Router.
 *
 * `renderItem` recebe `{ item, drag, isActive, ... }` em ambos os
 * caminhos. No web, `drag` é um no-op e `isActive` é `false`, então o
 * callsite não precisa saber em qual plataforma roda.
 */
export type AppDraggableListProps<T> = {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (params: RenderItemParams<T>) => React.ReactElement | null;
  onDragEnd?: (params: { data: T[] }) => void;
  contentContainerStyle?: FlatListProps<T>["contentContainerStyle"];
  ListEmptyComponent?: FlatListProps<T>["ListEmptyComponent"];
};

export function AppDraggableList<T>(props: AppDraggableListProps<T>) {
  return <DraggableFlatList {...props} />;
}

export type { RenderItemParams };
