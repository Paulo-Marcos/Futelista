import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { usePrefs } from "@/src/shared/prefs/prefsContext";
import { usePalette } from "@/src/shared/hooks/usePalette";
import {
  SegmentedControl,
  SegmentedOption,
} from "@/src/shared/ui/SegmentedControl";
import { useTheme, type ThemeModePreference } from "@/src/shared/theme/themeContext";
import { type ThemeId } from "@/src/shared/theme/themes";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Configurações globais do app (F-15).
 *
 * Tudo aqui vale para todas as peladas, não para a execução ativa —
 * por isso a tela vive fora do grupo `(pelada)`. Acessada pelo
 * Wordmark da Gestão (Home sem execução).
 *
 * Seções:
 *  - Aparência: modo (Auto/Claro/Escuro) + paleta de clube.
 *  - Avisos: toggle de apito háptico (espelha a section de /regras).
 *  - Backup: atalho pro Share do JSON (mesmo helper do F-14).
 *  - Sobre: nome do app + versão.
 */
const MODE_OPTIONS: SegmentedOption<ThemeModePreference>[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

export default function ConfiguracoesScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeId, mode, setMode, setThemeId, themes } = useTheme();
  const { prefs, setPrefs } = usePrefs();
  const { exportarBackup } = useSoccer();
  const [exportando, setExportando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const versao =
    (Constants.expoConfig?.version as string | undefined) ?? "0.0.0";

  const exportar = async () => {
    if (exportando) return;
    setExportando(true);
    setMensagem(null);
    try {
      const json = await exportarBackup();
      await Share.share({ message: json, title: "Backup FuteLista" });
      setMensagem("Backup exportado.");
    } catch (e) {
      setMensagem(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setExportando(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: palette.surfaceContainerHigh,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={palette.onSurface}
          />
        </Pressable>
        <Text style={[styles.title, { color: palette.onSurface }]}>
          Configurações
        </Text>
      </View>

      {/* ----- Aparência ----- */}
      <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant }]}>
        Aparência
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <Text style={[styles.cardLabel, { color: palette.onSurface }]}>
          Modo
        </Text>
        <Text style={[styles.cardHint, { color: palette.onSurfaceVariant }]}>
          "Auto" segue o tema do sistema operacional.
        </Text>
        <SegmentedControl<ThemeModePreference>
          value={mode}
          options={MODE_OPTIONS}
          onChange={(v) => setMode(v)}
        />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <Text style={[styles.cardLabel, { color: palette.onSurface }]}>
          Paleta do clube
        </Text>
        <Text style={[styles.cardHint, { color: palette.onSurfaceVariant }]}>
          Define a cor primária e os tons de fundo.
        </Text>
        <View style={styles.swatchGrid}>
          {themes.map((t) => (
            <PaletaChip
              key={t.id}
              id={t.id}
              label={t.label}
              swatch={t.swatch}
              selected={t.id === themeId}
              onPress={() => setThemeId(t.id)}
            />
          ))}
        </View>
      </View>

      {/* ----- Avisos ----- */}
      <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant }]}>
        Avisos
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <View style={styles.rowToggle}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: palette.onSurface }]}>
              Apito háptico
            </Text>
            <Text
              style={[styles.cardHint, { color: palette.onSurfaceVariant }]}
            >
              Vibração curta ao fim do tempo e em checkpoints (2min e 30s).
            </Text>
          </View>
          <Switch
            value={prefs.apitoHaptico}
            onValueChange={(v) => setPrefs({ apitoHaptico: v })}
            accessibilityLabel="Ligar ou desligar apito háptico"
            trackColor={{
              false: palette.outlineVariant,
              true: palette.primary,
            }}
            thumbColor={palette.surface}
          />
        </View>
      </View>

      {/* ----- Backup ----- */}
      <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant }]}>
        Backup
      </Text>

      <Pressable
        onPress={exportar}
        disabled={exportando}
        accessibilityRole="button"
        accessibilityLabel="Exportar backup"
        style={({ pressed }) => [
          styles.actionRow,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
            opacity: exportando ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="share-variant"
          size={20}
          color={palette.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardLabel, { color: palette.onSurface }]}>
            Exportar backup
          </Text>
          <Text style={[styles.cardHint, { color: palette.onSurfaceVariant }]}>
            JSON com todas as peladas, execuções e preferências.
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={palette.onSurfaceVariant}
        />
      </Pressable>

      {mensagem ? (
        <Text
          style={[styles.mensagem, { color: palette.onSurfaceVariant }]}
          selectable
        >
          {mensagem}
        </Text>
      ) : null}

      {/* ----- Sobre ----- */}
      <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant }]}>
        Sobre
      </Text>

      <Pressable
        onPress={() => router.push("/onboarding")}
        accessibilityRole="button"
        accessibilityLabel="Ver tour"
        style={({ pressed }) => [
          styles.actionRow,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="map-outline"
          size={20}
          color={palette.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardLabel, { color: palette.onSurface }]}>
            Ver tour
          </Text>
          <Text style={[styles.cardHint, { color: palette.onSurfaceVariant }]}>
            Revê os 3 slides do onboarding inicial.
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={palette.onSurfaceVariant}
        />
      </Pressable>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutKey, { color: palette.onSurfaceVariant }]}>
            App
          </Text>
          <Text style={[styles.aboutVal, { color: palette.onSurface }]}>
            FuteLista
          </Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutKey, { color: palette.onSurfaceVariant }]}>
            Versão
          </Text>
          <Text style={[styles.aboutVal, { color: palette.onSurface }]}>
            {versao}
          </Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutKey, { color: palette.onSurfaceVariant }]}>
            Plataforma
          </Text>
          <Text style={[styles.aboutVal, { color: palette.onSurface }]}>
            {Platform.OS}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * Chip de seleção de paleta. Mostra um trio de swatches (cor primária +
 * duas auxiliares) e o label do tema. Selecionado: borda primary 2px.
 */
function PaletaChip({
  id,
  label,
  swatch,
  selected,
  onPress,
}: {
  id: ThemeId;
  label: string;
  swatch: readonly [string, string, string];
  selected: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Aplicar paleta ${label}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.swatchChip,
        {
          backgroundColor: palette.surfaceContainerHigh,
          borderColor: selected ? palette.primary : palette.outlineVariant,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.swatchTrio}>
        {swatch.map((color, i) => (
          <View
            key={`${id}-${i}`}
            style={[styles.swatchDot, { backgroundColor: color }]}
          />
        ))}
      </View>
      <Text
        style={[styles.swatchLabel, { color: palette.onSurface }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected ? (
        <MaterialCommunityIcons
          name="check-circle"
          size={14}
          color={palette.primary}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.headline, fontSize: 22, fontWeight: "800", flex: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
    marginTop: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
    gap: Spacing.sm,
  },
  cardLabel: { ...Typography.title, fontSize: 14 },
  cardHint: { ...Typography.label, fontSize: 11, marginTop: -2 },
  rowToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  swatchChip: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  swatchTrio: {
    flexDirection: "row",
    gap: 2,
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatchLabel: { ...Typography.label, fontSize: 12, flex: 1 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  mensagem: { ...Typography.label, fontSize: 11, textAlign: "center" },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aboutKey: { ...Typography.label, fontSize: 11 },
  aboutVal: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums" as const],
  },
});
