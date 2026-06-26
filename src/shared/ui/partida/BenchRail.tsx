import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { Typography } from "@/src/shared/theme/Colors";

// BenchRail — trilho compacto centralizado verticalmente (top 50% / translateY -50%
// via marginTop = -(altura/2)). Pressable: toque abre o SubstitutionSheet, igual ao
// `<button class="bench">` do design.
export function BenchRail({
  side,
  reserves,
  posicaoNaFila,
  onOpen,
}: {
  side: "left" | "right";
  reserves: Player[];
  posicaoNaFila: number | null;
  onOpen: () => void;
}) {
  const palette = usePalette();
  if (!reserves || reserves.length === 0) return null;
  const visiveis = reserves.slice(0, 5);
  // O trilho tem fundo escuro fixo (vidro sobre o gramado), independente do
  // tema. Por isso ícone e rótulo usam claro fixo — `palette.onSurface` seria
  // preto no tema claro e sumiria sobre o fundo escuro.
  const FG = "rgba(255,255,255,0.95)";
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Banco com ${reserves.length} reservas — abrir trocas`}
      style={({ pressed }) => [
        styles.benchRail,
        side === "left" ? styles.benchRailLeft : styles.benchRailRight,
        {
          backgroundColor: "rgba(16,16,19,0.78)",
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.benchRailHead}>
        <MaterialCommunityIcons name="seat" size={18} color={FG} />
        <View style={styles.benchRailLabelWrap}>
          <Text
            style={[
              styles.benchRailLabel,
              {
                color: FG,
                transform: [{ rotate: side === "left" ? "-90deg" : "90deg" }],
              },
            ]}
          >
            BANCO{posicaoNaFila ? ` · ${posicaoNaFila}º` : ""}
          </Text>
        </View>
      </View>
      <View style={styles.benchRailAvs}>
        {visiveis.map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.benchAv,
              { borderColor: palette.background },
              i > 0 && { marginTop: -5 },
            ]}
          >
            <PlayerAvatar player={p} size={26} />
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Banco — design `.bench`: largura 40, centralizado vertical via marginTop = -altura/2.
  // Altura total ~240 (cabeçalho ~100: ícone + rótulo vertical 74 · ~5 avatares
  // 26 sobrepostos -5 = ~118). Não cresce para cobrir o campo todo. Toque abre
  // SubstitutionSheet.
  benchRail: {
    position: "absolute",
    top: "50%",
    width: 40,
    marginTop: -120,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 6,
    zIndex: 7,
  },
  benchRailLeft: {
    left: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  benchRailRight: {
    right: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  // Coluna: ícone em cima, rótulo "BANCO" (vertical) embaixo. Sem altura fixa
  // — cresce para acomodar o rótulo rotacionado, evitando o ícone por cima.
  benchRailHead: {
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  // O rótulo é rotacionado 90°: sem dimensões explícitas o RN reserva só a
  // caixa não-rotacionada (~14px de altura) e o texto vaza por cima do ícone.
  // Fixamos largura/altura iguais à projeção pós-rotação para reservar o espaço.
  benchRailLabelWrap: {
    width: 16,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
  },
  benchRailLabel: {
    ...Typography.label,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    width: 70,
    textAlign: "center",
  },
  benchRailAvs: { alignItems: "center", marginTop: 8 },
  benchAv: { borderWidth: 1.5, borderRadius: 999 },
});
