import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerRow } from "@/src/shared/ui/PlayerRow";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function LinhaJogador({
  player,
  mostrarSituacao,
  onEditar,
  onRemover,
  onVerStats,
  onTrocarFoto,
  onLongPress,
}: {
  player: Player;
  mostrarSituacao: boolean;
  onEditar: () => void;
  onRemover: () => void;
  onVerStats: () => void;
  onTrocarFoto: () => void;
  /**
   * Quando fornecido (M-07, modo reorder), substitui o long-press de
   * edição. O `DraggableFlatList` passa seu `drag` aqui — segurar a
   * linha começa o arrasto em vez de abrir o input de edição.
   */
  onLongPress?: () => void;
}) {
  const palette = usePalette();

  const totalGoals = player.goals.length;

  // Lado direito da linha: badge de gols (verde, 18% bg) + pencil(primary) +
  // delete(warning). Ordem importa — o handoff coloca pencil ANTES do delete.
  // No web mantemos a lixeira visível (sem Swipeable para descobrir).
  const acoes = (
    <View style={styles.rightActions}>
      {totalGoals > 0 ? (
        <View
          style={[
            styles.goalBadge,
            // Goal a ~18% — hex 8 dígitos "2E" ≈ 0.18 alpha.
            { backgroundColor: palette.goal + "2E" },
          ]}
        >
          <MaterialCommunityIcons
            name="soccer"
            size={13}
            color={palette.goal}
          />
          <Text style={[styles.goalBadgeText, { color: palette.goal }]}>
            {totalGoals}
          </Text>
        </View>
      ) : null}
      <Pressable
        onPress={onTrocarFoto}
        accessibilityRole="button"
        accessibilityLabel={`Trocar foto de ${player.name}`}
        style={styles.iconAction}
        android_ripple={{ color: palette.primary + "33" }}
      >
        <MaterialCommunityIcons
          name={player.fotoUri ? "camera-flip-outline" : "camera-outline"}
          size={20}
          color={palette.onSurfaceVariant}
        />
      </Pressable>
      <Pressable
        onPress={onVerStats}
        accessibilityRole="button"
        accessibilityLabel={`Ver estatísticas de ${player.name}`}
        style={styles.iconAction}
        android_ripple={{ color: palette.primary + "33" }}
      >
        <MaterialCommunityIcons
          name="chart-bar"
          size={20}
          color={palette.onSurfaceVariant}
        />
      </Pressable>
      <Pressable
        onPress={onEditar}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${player.name}`}
        style={styles.iconAction}
        android_ripple={{ color: palette.primary + "33" }}
      >
        <MaterialCommunityIcons
          name="pencil-outline"
          size={22}
          color={palette.primary}
        />
      </Pressable>
      {Platform.OS === "web" ? (
        <Pressable
          onPress={onRemover}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${player.name}`}
          style={styles.iconAction}
          android_ripple={{ color: palette.warning + "33" }}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={22}
            color={palette.warning}
          />
        </Pressable>
      ) : null}
    </View>
  );

  const sub =
    totalGoals > 0
      ? `${totalGoals} ${totalGoals === 1 ? "gol" : "gols"} na pelada`
      : "sem gols ainda";
  const linha = (
    <PlayerRow
      player={player}
      showSituation={mostrarSituacao}
      // showGoals=false — o badge verde do handoff é montado aqui no slot
      // `right`; deixar showGoals=true desenharia DOIS contadores.
      onLongPress={onLongPress ?? onEditar}
      subtitle={sub}
      right={acoes}
    />
  );

  if (Platform.OS === "web") return linha;

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          onPress={onRemover}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${player.name}`}
          style={[styles.swipeDeleteAction, { backgroundColor: palette.error }]}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={24}
            color={palette.onError}
          />
          <Text style={[styles.swipeDeleteText, { color: palette.onError }]}>
            Remover
          </Text>
        </Pressable>
      )}
      overshootRight={false}
    >
      {linha}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  // Pill verde mostrando "⚽ N" quando o jogador tem gols. Fundo é o tom
  // goal a ~18% (palette.goal + "2E"). Texto/ícone na cor cheia.
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginRight: Spacing.xs,
  },
  goalBadgeText: {
    fontWeight: "800",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  swipeDeleteAction: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    marginLeft: Spacing.xs,
    gap: 2,
  },
  swipeDeleteText: {
    ...Typography.label,
    fontSize: 11,
  },
});
