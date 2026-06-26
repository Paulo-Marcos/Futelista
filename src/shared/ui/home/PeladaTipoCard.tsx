import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ResumoPeladaTipo } from "@/src/domain/ports/RepositorioPelada";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";

export function PeladaTipoCard({
  resumo,
  recente,
  onAbrir,
}: {
  resumo: ResumoPeladaTipo;
  recente: boolean;
  onAbrir: () => void;
}) {
  const palette = usePalette();
  const agenda = formatAgenda(resumo.dia, resumo.hora);
  return (
    <Pressable
      onPress={onAbrir}
      accessibilityRole="button"
      accessibilityLabel={`Abrir pelada ${resumo.nome}`}
      style={({ pressed }) => [
        styles.peladaCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.crestBox,
          { backgroundColor: palette.surfaceContainerHigh },
        ]}
      >
        <TeamCrest seed={resumo.id} size={36} />
      </View>
      <View style={styles.peladaBody}>
        <View style={styles.peladaTopRow}>
          <Text
            style={[styles.peladaName, { color: palette.onSurface }]}
            numberOfLines={1}
          >
            {resumo.nome}
          </Text>
          {recente ? (
            <View
              style={[
                styles.recenteTag,
                { backgroundColor: palette.goal + "29" },
              ]}
            >
              <Text style={[styles.recenteTagText, { color: palette.goal }]}>
                RECENTE
              </Text>
            </View>
          ) : null}
        </View>
        {agenda || resumo.local ? (
          <View style={styles.peladaMetaRow}>
            {agenda ? (
              <View style={styles.peladaMetaItem}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={12}
                  color={palette.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.peladaMetaText,
                    { color: palette.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {agenda}
                </Text>
              </View>
            ) : null}
            {resumo.local ? (
              <View style={styles.peladaMetaItem}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={12}
                  color={palette.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.peladaMetaText,
                    { color: palette.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {resumo.local}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.peladaRulesRow}>
          <MaterialCommunityIcons
            name="account-multiple-outline"
            size={12}
            color={palette.onSurface}
          />
          <Text style={[styles.peladaRuleText, { color: palette.onSurface }]}>
            {resumo.regras.playersPerTeam}×{resumo.regras.playersPerTeam}
          </Text>
          <Text
            style={[styles.peladaRuleSep, { color: palette.onSurfaceVariant }]}
          >
            ·
          </Text>
          <MaterialCommunityIcons
            name="timer-outline"
            size={12}
            color={palette.onSurface}
          />
          <Text style={[styles.peladaRuleText, { color: palette.onSurface }]}>
            {timeMatchToLabel(resumo.regras.timeMatch)}
          </Text>
          <Text
            style={[styles.peladaRuleSep, { color: palette.onSurfaceVariant }]}
          >
            ·
          </Text>
          <MaterialCommunityIcons
            name="history"
            size={12}
            color={palette.onSurface}
          />
          <Text style={[styles.peladaRuleText, { color: palette.onSurface }]}>
            {resumo.totalExecucoes}{" "}
            {resumo.totalExecucoes === 1 ? "jogo" : "jogos"}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={palette.onSurfaceVariant}
      />
    </Pressable>
  );
}

function formatAgenda(dia?: string, hora?: string): string {
  if (dia && hora) return `${dia} · ${hora}`;
  return dia ?? hora ?? "";
}

function timeMatchToLabel(timeMatch: string): string {
  const [h, m] = timeMatch.split(":").map((s) => parseInt(s, 10));
  if (!Number.isNaN(h) && h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}min`;
}

const styles = StyleSheet.create({
  peladaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  crestBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  peladaBody: {
    flex: 1,
    gap: 4,
  },
  peladaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  peladaName: { ...Typography.title, fontSize: 16, fontWeight: "800", flex: 1 },
  peladaMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  peladaMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  peladaMetaText: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  peladaRulesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  peladaRuleText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  peladaRuleSep: {
    fontSize: 11.5,
    fontWeight: "600",
    marginHorizontal: 2,
  },
  recenteTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  recenteTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
