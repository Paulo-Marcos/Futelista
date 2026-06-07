import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Splash } from "@/src/shared/ui/Splash";

/**
 * Rota de inspeção visual da Splash. Renderiza em loop infinito até o
 * usuário tocar — útil para avaliar o efeito do glow sem time pressure.
 *
 * Acesso: navegar para `/splash-preview` (router.push).
 */
export default function SplashPreviewScreen() {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <Splash previewLoop onDone={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
});
