import { Stack } from "expo-router";

/**
 * Sub-stack das telas de Pelada: lista (index) e execuções ([id]).
 * Apresentação formSheet vem do _layout raiz; aqui só escondemos o header.
 */
export default function PeladasLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
