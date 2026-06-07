import { Stack } from "expo-router";

/**
 * Sub-stack da tela de edição de pelada — apenas a rota dinâmica `[id]`.
 * Apresentação formSheet vem do _layout raiz; aqui só escondemos o header.
 */
export default function PeladaEditarLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
