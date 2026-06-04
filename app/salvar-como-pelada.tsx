import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Converte a execução atual (avulsa) em uma Pelada cadastrada — o usuário
 * informa um nome e as regras default são herdadas da execução.
 */
export default function SalvarComoPeladaScreen() {
  const { gestor } = useSoccer();
  if (!gestor) return <Redirect href="/" />;
  if (gestor.peladaId) return <Redirect href="/" />;
  return <SalvarComoPeladaInner gestor={gestor} />;
}

function SalvarComoPeladaInner({ gestor }: { gestor: GestorJogo }) {
  const palette = usePalette();
  const router = useRouter();
  const { salvarExecucaoAtualComoPelada } = useSoccer();
  const nomeAtual = useGameSliceRequired((g) => g.name);
  const regras = useGameSliceRequired((g) => g.rules);

  const [nome, setNome] = useState(
    nomeAtual === "Pelada avulsa" ? "" : nomeAtual,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const onSalvar = () => {
    const nomeFinal = nome.trim();
    if (!nomeFinal) {
      setErro("Informe um nome para a pelada.");
      return;
    }
    setSalvando(true);
    salvarExecucaoAtualComoPelada(nomeFinal)
      .then(() => router.back())
      .catch((e) => {
        setErro(e instanceof Error ? e.message : String(e));
        setSalvando(false);
      });
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: palette.onSurface }]}>
          Salvar como pelada
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <MaterialCommunityIcons
            name="close"
            size={22}
            color={palette.onSurface}
          />
        </Pressable>
      </View>

      <Text style={[styles.intro, { color: palette.onSurfaceVariant }]}>
        A execução atual vai virar uma pelada cadastrada. As regras de agora
        ficam como default da pelada e podem ser editadas depois.
      </Text>

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
          Nome da pelada
        </Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Ex.: Fute CEF"
          placeholderTextColor={palette.onSurfaceVariant}
          autoFocus
          autoCapitalize="words"
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={onSalvar}
          style={[
            styles.input,
            {
              borderColor: palette.outline,
              backgroundColor: palette.surface,
              color: palette.onSurface,
            },
          ]}
        />
      </View>

      <Card variant="outlined" padding="md">
        <Text
          style={[styles.previewLabel, { color: palette.onSurfaceVariant }]}
        >
          Regras que serão salvas
        </Text>
        <Text style={[styles.previewText, { color: palette.onSurface }]}>
          {regras.playersPerTeam}×{regras.playersPerTeam} ·{" "}
          {timeMatchLabel(regras.timeMatch)} ·{" "}
          {regras.numberTimes === 1
            ? "1 tempo"
            : `${regras.numberTimes} tempos`}{" "}
          · limite {regras.goalLimit} gols
        </Text>
      </Card>

      {erro ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: palette.errorContainer,
              borderColor: palette.error,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: palette.error }]} selectable>
            {erro}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.flex}>
          <SecondaryButton
            label="Cancelar"
            onPress={() => router.back()}
            fullWidth
            disabled={salvando}
          />
        </View>
        <View style={styles.flex}>
          <PrimaryButton
            label={salvando ? "Salvando…" : "Salvar"}
            icon="content-save-outline"
            onPress={onSalvar}
            disabled={!nome.trim() || salvando}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  );
}

function timeMatchLabel(timeMatch: string): string {
  const [h, m] = timeMatch.split(":").map((s) => parseInt(s, 10));
  if (!Number.isNaN(h) && h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}min`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...Typography.headline },
  closeButton: { padding: 8, borderRadius: 20 },
  intro: { ...Typography.body, fontSize: 13 },
  field: { gap: Spacing.xs },
  fieldLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Typography.body,
    fontSize: 15,
    borderCurve: "continuous",
  },
  previewLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  previewText: { ...Typography.body, fontSize: 14 },
  errorBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  errorText: { ...Typography.label },
  flex: { flex: 1 },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
});
