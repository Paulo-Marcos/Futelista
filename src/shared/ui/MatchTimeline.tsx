import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Goal } from "@/src/domain/Goal";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * MatchTimeline — strip horizontal de gols (mais recente à esquerda),
 * cor por time (primary/secondary), minuto à direita do nome.
 * Quando `onUndo` é fornecido, o chip mais recente ganha um botão de
 * desfazer.
 *
 * Portado de prototype/js/match.jsx (MatchTimeline).
 */
type TimelineEntry = {
  id: string;
  side: "A" | "B";
  name: string;
  minute: number;
  /**
   * Goal original — passado de volta no `onLongPressGol` para que o
   * caller possa identificar exatamente qual gol foi tocado (corrigir
   * autor / remover). Mantemos a referência em vez de só o id porque o
   * domínio expõe os Goals como referência única e `gestor.removerGol`
   * usa `indexOf`.
   */
  goal: Goal;
};

export function MatchTimeline({
  goals,
  teamA,
  teamB,
  onUndo,
  onLongPressGol,
}: {
  goals: Goal[];
  teamA: Team;
  teamB: Team;
  onUndo?: () => void;
  /**
   * Long-press num chip da timeline. Quando fornecido, cada chip vira
   * interativo e dispara este callback com o Goal correspondente.
   * Usado para abrir o sheet de ações (corrigir autor / remover).
   */
  onLongPressGol?: (goal: Goal) => void;
}) {
  const palette = usePalette();
  if (goals.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          {
            backgroundColor: palette.surfaceContainerLow,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="soccer"
          size={13}
          color={palette.onSurfaceVariant}
        />
        <Text style={[styles.emptyText, { color: palette.onSurfaceVariant }]}>
          Toque num jogador no campo para marcar gol
        </Text>
      </View>
    );
  }

  const entries: TimelineEntry[] = goals
    .map((g, i) => ({
      id: `${g.player.id}-${i}`,
      side: g.team.id === teamA.id ? ("A" as const) : ("B" as const),
      name: g.player.name,
      minute: minuteOf(g),
      goal: g,
    }))
    .reverse();

  // M-14: snap por chip — guardamos a posição esquerda de cada item via
  // onLayout pra alimentar `snapToOffsets`. Com `decelerationRate="fast"`
  // a inércia engata num gol específico em vez de parar entre eles.
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.surfaceContainerLow,
          borderTopColor: palette.outlineVariant,
        },
      ]}
    >
      <TimelineScroll entries={entries}>
        {entries.map((e, i) => {
          const isMostRecent = i === 0;
          const tint = e.side === "A" ? palette.primary : palette.secondary;
          const baseStyle = [
            styles.chip,
            {
              backgroundColor: tint + "22",
              borderColor: tint + "55",
            },
          ];

          // CHIP MAIS RECENTE: mantém o botão de undo interno (Pressable
          // filho). Aqui NÃO podemos transformar o chip em outro Pressable
          // — no web vira <button> dentro de <button>, que é DOM inválido
          // (validateDOMNesting warning). Para corrigir o autor desse gol,
          // o usuário desfaz e refaz; o long-press fica disponível para
          // chips antigos.
          if (isMostRecent && onUndo) {
            return (
              <View key={e.id} style={baseStyle}>
                <MaterialCommunityIcons name="soccer" size={11} color={tint} />
                <Text style={[styles.chipName, { color: tint }]}>{e.name}</Text>
                <Text
                  style={[styles.chipMin, { color: palette.onSurfaceVariant }]}
                >
                  {e.minute}'
                </Text>
                <Pressable
                  onPress={onUndo}
                  accessibilityRole="button"
                  accessibilityLabel="Desfazer gol mais recente"
                  style={({ pressed }) => [
                    styles.undoBtn,
                    {
                      backgroundColor: palette.surfaceContainerHigh,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={11}
                    color={palette.onSurface}
                  />
                </Pressable>
              </View>
            );
          }

          const chipBody = (
            <>
              <MaterialCommunityIcons name="soccer" size={11} color={tint} />
              <Text style={[styles.chipName, { color: tint }]}>{e.name}</Text>
              <Text
                style={[styles.chipMin, { color: palette.onSurfaceVariant }]}
              >
                {e.minute}'
              </Text>
            </>
          );

          // Sem handler de long-press: chip estático.
          if (!onLongPressGol) {
            return (
              <View key={e.id} style={baseStyle}>
                {chipBody}
              </View>
            );
          }

          // Chip antigo + handler: vira Pressable com long-press.
          return (
            <Pressable
              key={e.id}
              onLongPress={() => onLongPressGol(e.goal)}
              delayLongPress={350}
              accessibilityRole="button"
              accessibilityLabel={`Ações do gol de ${e.name} aos ${e.minute} minutos`}
              accessibilityHint="Toque e segure para corrigir ou remover"
              android_ripple={{ color: tint + "33" }}
              style={({ pressed }) => [baseStyle, pressed && { opacity: 0.8 }]}
            >
              {chipBody}
            </Pressable>
          );
        })}
      </TimelineScroll>
    </View>
  );
}

/**
 * Scroll horizontal com snap calculado dinamicamente: cada filho
 * direto reporta sua posição via `onLayout` e o ScrollView usa esse
 * array como `snapToOffsets`. Funciona mesmo com chips de larguras
 * variáveis (nomes diferentes).
 */
function TimelineScroll({
  entries,
  children,
}: {
  entries: TimelineEntry[];
  children: React.ReactNode;
}) {
  const [offsets, setOffsets] = useState<number[]>([]);
  const offsetsRef = useRef<number[]>([]);

  const handleChildLayout = (index: number) => (e: LayoutChangeEvent) => {
    const x = e.nativeEvent.layout.x;
    offsetsRef.current[index] = x;
    // Só comita pro state quando temos posição de todos — evita re-render
    // intermediário enquanto o layout estabiliza.
    if (offsetsRef.current.filter((v) => v !== undefined).length === entries.length) {
      setOffsets([...offsetsRef.current]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
      decelerationRate="fast"
      snapToOffsets={offsets.length > 0 ? offsets : undefined}
      snapToAlignment="start"
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <View key={(child as React.ReactElement).key ?? i} onLayout={handleChildLayout(i)}>
              {child}
            </View>
          ))
        : children}
    </ScrollView>
  );
}

function minuteOf(g: Goal): number {
  // ScreenTime: stroke (tempo 1..N) + timeStroke (segundos transcorridos).
  // Tempo decorrido total em minutos para o chip.
  const seconds = g.time.timeStroke;
  return Math.max(0, Math.floor(seconds / 60));
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  track: {
    gap: Spacing.xs,
    alignItems: "center",
    paddingRight: Spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipName: { ...Typography.label, fontSize: 12 },
  chipMin: { ...Typography.label, fontSize: 11, fontVariant: ["tabular-nums"] },
  undoBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  emptyText: { ...Typography.label, fontSize: 12 },
});
